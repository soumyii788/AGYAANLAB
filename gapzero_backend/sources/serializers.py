from rest_framework import serializers
from .models import Source


class SourceSerializer(serializers.ModelSerializer):
    added_by_name = serializers.CharField(source='added_by.full_name', read_only=True)

    class Meta:
        model = Source
        fields = '__all__'
        read_only_fields = ['id', 'added_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['added_by'] = self.context['request'].user
        return super().create(validated_data)
