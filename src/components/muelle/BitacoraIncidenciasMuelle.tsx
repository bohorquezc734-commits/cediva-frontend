import { AlertTriangle, ShieldX } from 'lucide-react';
import type { IncidenciaMuelle } from '../../hooks/useVerificacionMuelle';

interface BitacoraIncidenciasMuelleProps {
  readonly incidencias: readonly IncidenciaMuelle[];
}

// === SUBCOMPONENTE: BITÁCORA DE TROCADOS Y NOVEDADES ===
export function BitacoraIncidenciasMuelle({ incidencias }: BitacoraIncidenciasMuelleProps) {
  if (incidencias.length === 0) return null;

  return (
    <div
      className="table-container"
      style={{ marginTop: '20px', border: '1px solid #fecaca' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          marginBottom: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#b91c1c',
            fontWeight: 700,
            fontSize: '15px',
          }}
        >
          <AlertTriangle size={18} />
          Bitácora de Alertas Anti-Trocados ({incidencias.length})
        </div>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 10px',
            borderRadius: '999px',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          <ShieldX size={13} /> Revisar mercancía apartada
        </span>
      </div>

      <table>
        <thead>
          <tr>
            <th>Hora</th>
            <th>Código Pistoleado</th>
            <th>Novedad Detectada en Muelle</th>
          </tr>
        </thead>
        <tbody>
          {incidencias.map((inc) => (
            <tr key={inc.id}>
              <td style={{ whiteSpace: 'nowrap', color: '#475569', fontWeight: 600 }}>
                {inc.hora}
              </td>
              <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                {inc.codigo}
              </td>
              <td style={{ color: '#991b1b', fontWeight: 600 }}>{inc.motivo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}