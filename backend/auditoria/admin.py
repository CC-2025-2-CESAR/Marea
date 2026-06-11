"""Admin somente-leitura para a trilha de auditoria.

O log é de acréscimo: nem pelo admin ele pode ser criado, editado ou apagado —
isso preserva a integridade da trilha exigida pela LGPD.
"""

from django.contrib import admin

from .models import LogAtividade


@admin.register(LogAtividade)
class LogAtividadeAdmin(admin.ModelAdmin):
    list_display = ('data_hora', 'usuario', 'acao', 'entidade', 'paciente')
    list_filter = ('acao', 'entidade')
    search_fields = (
        'usuario__username',
        'paciente__perfil__nome_completo',
        'motivo',
    )
    date_hierarchy = 'data_hora'
    readonly_fields = (
        'usuario',
        'acao',
        'entidade',
        'entidade_id',
        'paciente',
        'motivo',
        'data_hora',
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
