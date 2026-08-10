from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.forms import BaseUserCreationForm, UserChangeForm

from .models import OtpToken, RefreshToken, User


class AdminUserCreationForm(BaseUserCreationForm):
    """password1/password2 with hashing + validation, retargeted at our User.

    BaseUserCreationForm (not AdminUserCreationForm) on purpose: the latter also
    declares a `usable_password` field, which would be required-but-unrendered
    unless it is listed in add_fieldsets.
    """

    class Meta(BaseUserCreationForm.Meta):
        model = User
        fields = ("email", "name")
        field_classes = {}  # drop auth.User's username -> UsernameField mapping


class AdminUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = User
        fields = "__all__"
        field_classes = {}


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    """Subclasses Django's auth UserAdmin for real password handling.

    A plain ModelAdmin cannot hash passwords — creating a user through it stored
    an unusable password and offered no way to change one. Every fieldset is
    overridden because our User is AbstractBaseUser + PermissionsMixin: there is
    no `username`, `first_name`, `last_name`, `date_joined`, and `is_active` is a
    class attribute (always True), not a column.
    """

    add_form = AdminUserCreationForm
    form = AdminUserChangeForm

    list_display = (
        "email", "name", "student_id", "role", "department",
        "email_verified", "is_staff", "created_at",
    )
    list_filter = ("role", "department", "email_verified", "is_staff", "is_superuser")
    search_fields = ("email", "name", "student_id")
    ordering = ("-created_at",)
    readonly_fields = ("id", "last_login", "created_at")
    filter_horizontal = ("groups", "user_permissions")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Profile", {
            "fields": ("name", "student_id", "gender", "department",
                       "semester_number", "profile_pic_url"),
        }),
        ("Role & access", {
            "fields": ("role", "email_verified", "is_staff", "is_superuser",
                       "groups", "user_permissions"),
        }),
        ("Internal", {"fields": ("id", "last_login", "created_at")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "name", "password1", "password2"),
        }),
        ("Role & access", {
            "classes": ("wide",),
            "description": "For an extra admin: role=ADMIN, tick is_staff and "
                           "is_superuser, and tick email verified so they can "
                           "also log into the student/admin frontend.",
            "fields": ("role", "student_id", "email_verified",
                       "is_staff", "is_superuser"),
        }),
    )


@admin.register(RefreshToken)
class RefreshTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "expires_at", "created_at")


@admin.register(OtpToken)
class OtpTokenAdmin(admin.ModelAdmin):
    list_display = ("email", "used", "expires_at", "created_at")
