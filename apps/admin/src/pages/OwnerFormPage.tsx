import { useState } from 'preact/hooks';
import { ArrowLeft } from 'lucide-preact';
import { Link, useLocation, useRoute } from 'wouter-preact';
import { OwnerForm } from '@components/owners';
import { useOwner, useCreateOwner, useUpdateOwner } from '@lib/owners/api';
import { queryClient } from '@lib/query/client';
import { pushToast } from '@store/app';
import type { OwnerFormValues } from '@lib/owners/schemas';

export function OwnerFormPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/propietarios/:id');
  const editId = params?.id && params.id !== 'nuevo' ? params.id : null;

  const isNew = !editId;
  const [saving, setSaving] = useState(false);

  const { data: owner, isLoading, isError, error } = useOwner(editId);
  const createOwner = useCreateOwner();
  const updateOwner = useUpdateOwner();

  const handleSubmit = async (data: OwnerFormValues) => {
    setSaving(true);
    try {
      if (isNew) {
        await createOwner.mutateAsync(data);
        pushToast({ type: 'success', title: 'Propietario creado', description: data.full_name });
      } else {
        await updateOwner.mutateAsync({ id: editId!, owner: data });
        pushToast({ type: 'success', title: 'Propietario actualizado', description: data.full_name });
      }
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      setLocation('/propietarios');
    } catch (err) {
      pushToast({ type: 'error', title: isNew ? 'No se pudo crear' : 'No se pudo actualizar', description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setLocation('/propietarios');
  };

  if (isLoading) {
    return (
      <div className="page">
        <div className="page-head">
          <Link href="/propietarios" className="btn btn--ghost">
            <ArrowLeft size={16} /> Volver
          </Link>
        </div>
        <div className="card placeholder-card">Cargando…</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page">
        <div className="page-head">
          <Link href="/propietarios" className="btn btn--ghost">
            <ArrowLeft size={16} /> Volver
          </Link>
        </div>
        <div className="card placeholder-card">No se pudo cargar el propietario: {error?.message}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <Link href="/propietarios" className="btn btn--ghost">
          <ArrowLeft size={16} /> Volver
        </Link>
        <div>
          <h2 className="page-title">{isNew ? 'Nuevo propietario' : 'Editar propietario'}</h2>
          <p className="page-subtitle">{isNew ? 'Registrá un nuevo propietario en la cartera.' : 'Actualizá los datos del propietario.'}</p>
        </div>
      </div>

      <div className="card form-card">
        <OwnerForm
          initialData={isNew ? undefined : {
            full_name: owner!.full_name,
            email: owner!.email ?? '',
            phone: owner!.phone ?? '',
            dni_cuit: owner!.dni_cuit ?? '',
            address: owner!.address ?? '',
            owner_type: owner!.owner_type,
            company_name: owner!.company_name ?? '',
            notes: owner!.notes ?? '',
            preferred_contact: owner!.preferred_contact,
          }}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={saving}
          submitLabel={isNew ? 'Crear propietario' : 'Guardar cambios'}
        />
      </div>
    </div>
  );
}