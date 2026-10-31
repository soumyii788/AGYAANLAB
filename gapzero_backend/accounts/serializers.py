"""
Accounts app serializers
"""
import re
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import models
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'organization', 'phone', 'bio', 'avatar',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'email', 'username', 'created_at', 'updated_at']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'organization', 'role'
        ]

    def validate_email(self, value):
        return value.strip().lower()

    def validate_username(self, value):
        base_username = re.sub(r'[^a-zA-Z0-9_]', '', value) or 'user'
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1
        return username

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer that accepts email or username, case-insensitive, auto-creates accounts for new emails, and includes user data."""

    def run_validation(self, data=serializers.empty):
        if data is not serializers.empty:
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            identifier = data.get('email') or data.get('username') or ''
            identifier = str(identifier).strip()
            password = data.get('password')

            user = User.objects.filter(
                models.Q(email__iexact=identifier) | models.Q(username__iexact=identifier)
            ).first()

            # If the user does not exist yet and provided a valid email + password, auto-create account
            if not user and '@' in identifier and password:
                email = identifier.lower()
                base_username = re.sub(r'[^a-zA-Z0-9_]', '', email.split('@')[0]) or 'user'
                username = base_username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}_{counter}"
                    counter += 1

                user = User(
                    email=email,
                    username=username,
                    first_name=base_username.capitalize(),
                    role='researcher'
                )
                user.set_password(password)
                user.save()

            if user:
                data[self.username_field] = user.email
            elif identifier:
                data[self.username_field] = identifier

        return super().run_validation(data)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['username'] = user.username
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change."""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password': 'New passwords do not match.'})
        return attrs
