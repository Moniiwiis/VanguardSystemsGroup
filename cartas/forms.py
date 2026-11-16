from django import forms
from .models import Carta


class CartaForm(forms.ModelForm):
    class Meta:
        model = Carta
        fields = [
            'fecha', 'numero', 'para', 'remite', 'fono_contacto', 'actividad_tema',
            'fecha_actividad', 'encargado_seguimiento', 'estado', 'pronunciamiento',
            'derivada_a', 'observacion', 'unidad'
        ]
        widgets = {
            'fecha': forms.DateInput(attrs={'type': 'date'}, format='%Y-%m-%d'),
            'actividad_tema': forms.Textarea(attrs={'rows': 3}),
            'pronunciamiento': forms.Textarea(attrs={'rows': 2}),
            'observacion': forms.Textarea(attrs={'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['fecha'].input_formats = ['%Y-%m-%d']
        self.fields['fecha'].required = True
        for field in self.fields.values():
            field.widget.attrs['class'] = 'w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-red-300'
