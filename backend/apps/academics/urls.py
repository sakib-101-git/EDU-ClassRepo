from django.urls import path

from . import views

urlpatterns = [
    path("courses", views.CourseListCreateView.as_view()),
    path("courses/enrolled", views.EnrolledCoursesView.as_view()),
    path("courses/<str:identifier>", views.CourseDetailView.as_view()),
    path("courses/<str:identifier>/enroll", views.EnrollView.as_view()),
    path("departments", views.DepartmentListView.as_view()),
    path("faculty", views.FacultyListView.as_view()),
    path("faculty/<uuid:faculty_id>", views.FacultyDetailView.as_view()),
]
