import { useLocation } from 'wouter-preact';
import { Breadcrumb, type BreadcrumbItem } from '@bienenhaus/ui';

/** Route segment → { label, href? } map for intermediate crumbs. */
const SEGMENT_LABELS: Record<string, string> = {
    propiedades: 'Propiedades',
    leads: 'Leads',
    agentes: 'Agentes',
    visitas: 'Visitas',
    chat: 'Chat',
    mercadolibre: 'Mercado Libre',
    newsletter: 'Newsletter',
    papelera: 'Papelera',
    propietarios: 'Propietarios',
    'planes-accion': 'Planes de Acción',
    comunicaciones: 'Comunicaciones',
    reportes: 'Reportes',
    sitio: 'Sitio Web',
    usuarios: 'Usuarios',
    configuracion: 'Configuración',
    auditoria: 'Auditoría',
};

/** Leaf segment labels (the final crumb, current page). */
const LEAF_LABELS: Record<string, string> = {
    nueva: 'Nuevo',
    analisis: 'Análisis',
    planes: 'Planes',
};

/** Build breadcrumb items from the current wouter location path. */
function buildItems(path: string): BreadcrumbItem[] {
    const items: BreadcrumbItem[] = [{ label: 'Inicio', href: '/' }];
    if (path === '/' || path === '') return items;

    const segments = path.split('/').filter(Boolean);
    let accumulated = '';
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        accumulated += `/${seg}`;
        const isLast = i === segments.length - 1;
        const label = SEGMENT_LABELS[seg] ?? LEAF_LABELS[seg] ?? decodeSegment(seg);
        if (isLast) {
            items.push({ label });
        } else {
            items.push({ label, href: accumulated });
        }
    }
    return items.slice(0, 4);
}

/** Decode a dynamic id segment into a readable label. */
function decodeSegment(seg: string): string {
    if (/^\d+$/.test(seg) || /^[0-9a-f]{8}-/i.test(seg)) return 'Detalle';
    return seg.charAt(0).toUpperCase() + seg.slice(1);
}

export function BreadcrumbNav() {
    const [location] = useLocation();
    const items = buildItems(location);
    return <Breadcrumb items={items} maxItems={4} />;
}
