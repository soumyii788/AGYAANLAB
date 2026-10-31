"""
Accounts app views
"""
from django.contrib.auth import get_user_model
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    CustomTokenObtainPairSerializer,
    ChangePasswordSerializer,
)
import json
import base64
import urllib.request
import re

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom login view that returns user data alongside JWT tokens."""
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    """User registration endpoint."""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens for the newly registered user
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data

        return Response({
            'user': user_data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            'message': 'Registration successful.'
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get and update authenticated user's profile."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """Change password for authenticated user."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'old_password': 'Current password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password updated successfully.'})


class LogoutView(APIView):
    """Logout by blacklisting the refresh token."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response({'error': 'Refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logged out successfully.'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class GoogleAuthView(APIView):
    """Google OAuth2 authentication endpoint.
    
    Accepts Google Identity Services credential/id_token or Google profile data.
    Verifies or decodes the identity, creates or retrieves the user, and returns SimpleJWT tokens.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        credential = request.data.get('credential') or request.data.get('token')
        email = request.data.get('email')
        name = request.data.get('name', '')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        google_id = request.data.get('google_id', '')

        # Attempt to decode or verify token if provided
        if credential:
            # First try parsing the unverified JWT payload (standard 3-part base64 encoded token)
            try:
                parts = credential.split('.')
                if len(parts) >= 2:
                    padding = '=' * (4 - len(parts[1]) % 4)
                    payload_raw = base64.urlsafe_b64decode(parts[1] + padding).decode('utf-8')
                    payload = json.loads(payload_raw)
                    if not email and payload.get('email'):
                        email = payload.get('email')
                    if not first_name and payload.get('given_name'):
                        first_name = payload.get('given_name')
                    if not last_name and payload.get('family_name'):
                        last_name = payload.get('family_name')
                    if not name and payload.get('name'):
                        name = payload.get('name')
                    if not google_id and payload.get('sub'):
                        google_id = payload.get('sub')
            except Exception as e:
                pass

            # Optional: attempt live verification with Google tokeninfo endpoint
            if not email:
                try:
                    url = f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}"
                    req = urllib.request.Request(url, headers={'User-Agent': 'AGYAAN-LAB-Auth/1.0'})
                    with urllib.request.urlopen(req, timeout=3) as resp:
                        if resp.status == 200:
                            data = json.loads(resp.read().decode('utf-8'))
                            email = data.get('email')
                            first_name = data.get('given_name', '')
                            last_name = data.get('family_name', '')
                            name = data.get('name', '')
                except Exception:
                    pass

        if not email:
            return Response(
                {'error': 'A valid Google email address is required for authentication.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        email = email.strip().lower()

        # Parse name components if only full name was supplied
        if not first_name and name:
            name_parts = name.strip().split(' ')
            first_name = name_parts[0]
            last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''

        if not first_name:
            first_name = email.split('@')[0].capitalize()

        # Generate a unique username based on the email
        base_username = re.sub(r'[^a-zA-Z0-9_]', '_', email.split('@')[0])
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exclude(email=email).exists():
            username = f"{base_username}_{counter}"
            counter += 1

        # Retrieve or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': username,
                'first_name': first_name,
                'last_name': last_name,
                'organization': 'Google Workspace Research',
                'role': User.Role.RESEARCHER,
                'is_active': True,
            }
        )

        if created:
            user.set_unusable_password()
            user.save()
        else:
            # Update names if empty
            updated = False
            if not user.first_name and first_name:
                user.first_name = first_name
                updated = True
            if not user.last_name and last_name:
                user.last_name = last_name
                updated = True
            if updated:
                user.save()

        # Issue SimpleJWT tokens
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': user_data,
            'message': 'Google authentication successful.'
        }, status=status.HTTP_200_OK)
