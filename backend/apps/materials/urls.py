from django.urls import path

from . import views

urlpatterns = [
    path("materials/course/<uuid:course_id>", views.CourseMaterialsView.as_view()),
    path("materials/pending", views.PendingMaterialsView.as_view()),
    path("materials/upload", views.UploadView.as_view()),
    path("materials/<uuid:material_id>/approve", views.ApproveView.as_view()),
    path("materials/<uuid:material_id>/reject", views.RejectView.as_view()),
    path("materials/<uuid:material_id>/rename", views.RenameView.as_view()),
    path("materials/<uuid:material_id>", views.DeleteView.as_view()),
]
