"""
Serializers for administrative user management in the HelpDesk system.
This module provides a comprehensive serializer for creating and listing users,
including the automatic creation of role-specific profiles (Client or Member).
"""

from rest_framework import serializers
from django.db import transaction
from django.contrib.auth import get_user_model
from tickets.models.client import Client
from tickets.models.member import Member
from core.models import CompanyType, Issue

# Get the custom User model
User = get_user_model()


class UserAdminSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for Admin-level user management.
    
    This serializer handles:
    1. Base User creation (username, password, email, role).
    2. Conditional profile creation based on the user's role.
    3. Integration of Client-specific fields (company, whatsapp, etc.).
    4. Integration of Member-specific fields (specialty).
    """
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    # Client-specific fields (write-only as they are stored in the Client model)
    company_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    company_type_id = serializers.PrimaryKeyRelatedField(
        queryset=CompanyType.objects.all(), required=False, write_only=True, source='company_type', allow_null=True
    )
    contract_duration = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    whatsapp_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    # Member-specific fields (write-only as they are stored in the Member model)
    specialty_id = serializers.PrimaryKeyRelatedField(
        queryset=Issue.objects.all(), required=False, write_only=True, source='specialty', allow_null=True
    )

    class Meta:
        """
        Meta configuration for UserAdminSerializer.
        """
        model = User
        fields = [
            "id", "username", "email", "password", "role", "is_active", "date_joined",
            "company_name", "company_type_id", "contract_duration", "whatsapp_number",
            "specialty_id"
        ]
        read_only_fields = ["id", "date_joined"]

    def validate(self, data):
        """
        Perform cross-field validation based on the user's role.
        Ensures that required profile fields are present for the chosen role.
        
        Args:
            data: The dictionary of input data to validate.
            
        Returns:
            dict: The validated data.
            
        Raises:
            ValidationError: If required profile fields are missing.
        """
        role = data.get("role", getattr(self.instance, "role", None))
        is_update = self.instance is not None
        
        # Validate Client-specific requirements
        if role == User.Role.CLIENT:
            if "company_name" in data or not is_update:
                if not data.get("company_name"):
                    raise serializers.ValidationError({"company_name": "This field is required for Client role."})
            if "company_type" in data or not is_update:
                if not data.get("company_type"):
                    raise serializers.ValidationError({"company_type_id": "This field is required for Client role."})
            if "whatsapp_number" in data or not is_update:
                if not data.get("whatsapp_number"):
                    raise serializers.ValidationError({"whatsapp_number": "This field is required for Client role."})
        
        # Validate Member-specific requirements
        elif role == User.Role.MEMBER:
            if "specialty" in data or not is_update:
                if not data.get("specialty"):
                    raise serializers.ValidationError({"specialty_id": "This field is required for Member role."})
                
        return data

    @transaction.atomic
    def create(self, validated_data):
        """
        Create a new User and their corresponding profile in a single atomic transaction.
        
        Args:
            validated_data: Validated data from the request.
            
        Returns:
            User: The newly created user instance.
        """
        # Extract profile-specific data from the validated data pool
        role = validated_data.get("role")
        
        client_data = {
            "company_name": validated_data.pop("company_name", None),
            "company_type": validated_data.pop("company_type", None),
            "contract_duration": validated_data.pop("contract_duration", None),
            "whatsapp_number": validated_data.pop("whatsapp_number", None),
        }
        
        member_data = {
            "specialty": validated_data.pop("specialty", None),
        }

        # Create the base User object
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password) # Securely hash the password
        user.save()

        # Create the linked profile based on the assigned role
        if role == User.Role.CLIENT:
            Client.objects.create(
                user=user,
                email=user.email,
                **{k: v for k, v in client_data.items() if v is not None}
            )
        elif role == User.Role.MEMBER:
            Member.objects.create(
                user=user,
                **{k: v for k, v in member_data.items() if v is not None}
            )

        return user

    @transaction.atomic
    def update(self, instance, validated_data):
        """
        Update an existing User and their corresponding profile in a single atomic transaction.
        """
        # Extract profile-specific data
        company_name = validated_data.pop("company_name", None)
        company_type = validated_data.pop("company_type", None)
        contract_duration = validated_data.pop("contract_duration", None)
        whatsapp_number = validated_data.pop("whatsapp_number", None)
        specialty = validated_data.pop("specialty", None)

        # Handle password update if provided
        password = validated_data.pop("password", None)
        if password:
            instance.set_password(password)

        # Update the base User instance
        instance = super().update(instance, validated_data)

        # Update the linked profile based on the role
        if instance.role == User.Role.CLIENT:
            client, created = Client.objects.get_or_create(
                user=instance,
                defaults={
                    "email": instance.email,
                    "company_name": company_name or "",
                    "whatsapp_number": whatsapp_number or "",
                    "company_type": company_type or CompanyType.objects.first()
                }
            )
            if company_name is not None:
                client.company_name = company_name
            if company_type is not None:
                client.company_type = company_type
            if contract_duration is not None:
                client.contract_duration = contract_duration
            if whatsapp_number is not None:
                client.whatsapp_number = whatsapp_number
            if "email" in validated_data:
                client.email = validated_data["email"]
            client.save()

        elif instance.role == User.Role.MEMBER:
            member, created = Member.objects.get_or_create(user=instance)
            if specialty is not None:
                member.specialty = specialty
            member.save()

        return instance

    def to_representation(self, instance):
        """
        Modify the output JSON to include profile-specific information when reading data.
        
        Args:
            instance: The User model instance.
            
        Returns:
            dict: The serialized data including nested profile information.
        """
        # Get the default representation
        data = super().to_representation(instance)
        
        # Inject Client profile details if the user is a client
        if instance.role == User.Role.CLIENT and hasattr(instance, "client"):
            data["client_profile"] = {
                "id": instance.client.id,
                "company_name": instance.client.company_name,
                "company_type": instance.client.company_type.name if instance.client.company_type else "",
                "whatsapp_number": instance.client.whatsapp_number,
                "contract_duration": instance.client.contract_duration,
            }
        # Inject Member profile details if the user is a member
        elif instance.role == User.Role.MEMBER and hasattr(instance, "member"):
            data["member_profile"] = {
                "specialty": instance.member.specialty.name if instance.member.specialty else "",
                "is_active": instance.member.is_active,
            }
            
        return data
