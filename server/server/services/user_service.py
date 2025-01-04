import hashlib
import os

from models.user import UserData
from repositories.user_repository import UserRepository


class UserService:
    @staticmethod
    def hash_password(password, salt=None):
        """Hashes the password using sha256 with optional salt and returns salt + hash"""
        if not salt:
            salt = os.urandom(16)  # Generate a random salt (16 bytes)

        # Salt is already in bytes, so only encode the password (which is a string)
        print(salt)
        salted_password = str(salt) + password.encode('utf-8')

        # Hash the salted password
        hashed = hashlib.sha256(salted_password).hexdigest().encode('utf-8')

        # Return the salt + hash (both as bytes)
        return salt + hashed  # Store both salt and hash together as bytes

    @staticmethod
    def verify_password(stored_password, input_password):
        """Compares stored password hash with the input password after hashing the input"""
        salt = stored_password[:16]  # Extract the salt (first 16 bytes)
        stored_hash = stored_password[16:]  # Extract the hash (remaining bytes)

        # Encode the input password (which is a string) to bytes and concatenate with salt
        salted_input_password = salt + input_password.encode('utf-8')

        # Hash the salted input password
        input_hash = hashlib.sha256(salted_input_password).hexdigest().encode('utf-8')

        # Compare the input hash with the stored hash
        return input_hash == stored_hash  # Return True if hashes match, False otherwise

    @staticmethod
    def login(username, password):
        """Handles user login by verifying password"""
        # Find user by username (this should be fetched from the DB)
        user = UserRepository.find_by_username(username)

        if not user:
            return False, "User not found"

        # Verify the password
        if not UserService.verify_password(user.password, password):
            return False, "Invalid credentials"

        return True, "Login successful"

    @staticmethod
    def register_user(username, password):
        """Handles user registration by hashing password and saving the user"""
        # Check if the user already exists (this should check the DB)
        existing_user = UserRepository.find_by_username(username)
        if existing_user:
            return False, "Username is already taken"

        # Hash the password during registration
        hashed_password = UserService.hash_password(password)

        # Save the new user to the database (this should save to DB)
        new_user = UserData(username=username, password=hashed_password)
        UserRepository.save(new_user)

        return True, "User registered successfully"