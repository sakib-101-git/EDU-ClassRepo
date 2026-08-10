"""Pagination that mimics Spring Data's Page JSON shape.

The Next.js frontend was built against the old Spring Boot API, which returns
paginated lists as {content, totalElements, totalPages, number, size} with a
ZERO-indexed page number. This class reproduces that exactly.
"""
from django.core.paginator import EmptyPage
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class SpringPagePagination(PageNumberPagination):
    page_query_param = "page"       # zero-indexed, like Spring
    page_size_query_param = "size"
    max_page_size = 100

    def get_page_number(self, request, paginator):
        try:
            requested = int(request.query_params.get(self.page_query_param, 0))
        except (TypeError, ValueError):
            requested = 0
        # Django's Paginator is 1-indexed; Spring's pages are 0-indexed.
        return max(requested, 0) + 1

    def paginate_queryset(self, queryset, request, view=None):
        try:
            return super().paginate_queryset(queryset, request, view)
        except Exception:
            # Spring returns an empty page (not a 404) when past the last page.
            self.page = None
            self.request = request
            self._empty_count = queryset.count() if hasattr(queryset, "count") else len(queryset)
            self._empty_size = self.get_page_size(request)
            self._empty_number = self.get_page_number(request, None) - 1
            return []

    def get_paginated_response(self, data):
        if self.page is None:
            size = self._empty_size or 20
            total = self._empty_count
            return Response({
                "content": data,
                "totalElements": total,
                "totalPages": max((total + size - 1) // size, 1),
                "number": self._empty_number,
                "size": size,
            })
        return Response({
            "content": data,
            "totalElements": self.page.paginator.count,
            "totalPages": self.page.paginator.num_pages,
            "number": self.page.number - 1,
            "size": self.page.paginator.per_page,
        })
