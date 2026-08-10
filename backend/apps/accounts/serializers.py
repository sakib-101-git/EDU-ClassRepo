from rest_framework import serializers

from apps.academics.models import Department

from .models import User


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    student_id = serializers.CharField(max_length=50, required=False, allow_blank=True)
    email = serializers.EmailField(max_length=150)
    password = serializers.CharField(min_length=8, max_length=128)
    department_code = serializers.CharField(max_length=20, required=False, allow_blank=True)
    gender = serializers.ChoiceField(choices=User.Gender.choices, required=False, allow_blank=True)
    semester_number = serializers.IntegerField(required=False, min_value=1, max_value=15)


class UserSummarySerializer(serializers.ModelSerializer):
    """User shape returned by /api/users/me and inside AuthResponse.

    department is intentionally {code, name} only — that's what the old
    Spring API returned here (Course.department has id as well; keep the
    asymmetry, the frontend types depend on it).
    """

    department = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "student_id", "name", "email", "role",
            "department", "gender", "semester_number", "profile_pic_url",
        ]

    def get_department(self, user):
        if user.department is None:
            return None
        return {"code": user.department.code, "name": user.department.name}
