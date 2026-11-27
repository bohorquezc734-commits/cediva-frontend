import { useEffect, useState } from 'react';
import { Camera, CheckCircle2, ClipboardCheck, Plus, RotateCcw } from 'lucide-react';
import { useVerificacionMuelle } from '../hooks/useVerificacionMuelle';
import { SelectorFacturaMuelle } from '../components/muelle/SelectorFacturaMuelle';
import { EscanerRfMuelle } from '../components/muelle/EscanerRfMuelle';
import { ChecklistMuelleTable } from '../components/muelle/ChecklistMuelleTable';
import { BitacoraIncidenciasMuelle } from '../components/muelle/BitacoraIncidenciasMuelle';
import { ModalNuevaFacturaMuelle } from '../components/muelle/ModalNuevaFacturaMuelle';
import { ModalEscanerCamara } from '../components/muelle/ModalEscanerCamara';
import type { OrdenFacturaMuelle, Producto, RolUsuario } from '../types/cediva';

interface VerificacionMuelleViewProps {
  readonly productos: readonly Producto[];
  readonly facturas: readonly OrdenFacturaMuelle[];
  readonly onCambiarFacturas: (
    updater: (prev: OrdenFacturaMuelle[]) => OrdenFacturaMuelle[]
  ) => void;
  readonly auditorNombre?: string;
  readonly onRecargarDatos: () => Promise<void>;
  readonly onFacturaAuditada?: (facturaAuditada: OrdenFacturaMuelle) => Promise<void> | void;
  readonly onIrATrazabilidad?: () => void;
  readonly usuarioRol: RolUsuario;
}

interface EstadoSinPendientesProps {
  readonly puedeGestionarFacturas: boolean;
  readonly totalAuditadas: number;
  readonly onIrATrazabilidad?: () => void;
}

function EstadoSinPendientes({
  puedeGestionarFacturas,
  totalAuditadas,
  onIrATrazabilidad,
}: EstadoSinPendientesProps) {
  const mensaje = puedeGestionarFacturas
    ? 'No hay facturas pendientes por pistolear. Crea una nueva o revisa Trazabilidad Muelle.'
    : 'No hay facturas pendientes por pistolear. Espera una nueva asignación o revisa Trazabilidad Muelle.';

  const etiquetaProcesadas =
    totalAuditadas === 1 ? 'factura procesada' : 'facturas procesadas';

  return (
    <div
      className="kpi-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '12px',
        marginBottom: '20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <CheckCircle2 size={20} color="#16a34a" />
        <strong style={{ fontSize: '16px', color: '#0f172a' }}>
          Sin facturas pendientes en muelle
        </strong>
      </div>

      <p
        style={{
          margin: 0,
          fontSize: '14px',
          color: '#15803d',
          fontWeight: 600,
          lineHeight: 1.45,
        }}
      >
        {mensaje}
      </p>

      {totalAuditadas > 0 && (
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
          Tienes {totalAuditadas} {etiquetaProcesadas} en Trazabilidad Muelle.
        </p>
      )}

      {onIrATrazabilidad && (
        <button
          type="button"
          className="btn-primary"
          onClick={onIrATrazabilidad}
          style={{ marginTop: '4px' }}
        >
          <ClipboardCheck size={18} />
          <span>Ir a Trazabilidad Muelle</span>
        </button>
      )}
    </div>
  );
}

interface ControlesCamaraRfProps {
  readonly deshabilitado: boolean;
  readonly autoCamara: boolean;
  readonly onAbrirCamara: () => void;
  readonly onToggleAutoCamara: (valor: boolean) => void;
}

function ControlesCamaraRf({
  deshabilitado,
  autoCamara,
  onAbrirCamara,
  onToggleAutoCamara,
}: ControlesCamaraRfProps) {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <button
        type="button"
        disabled={deshabilitado}
        onClick={onAbrirCamara}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '0 18px',
          height: '100%',
          minHeight: '48px',
          borderRadius: '12px',
          border: 'none',
          background: deshabilitado ? '#94a3b8' : '#0f172a',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '13px',
          cursor: deshabilitado ? 'not-allowed' : 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <Camera size={18} />
        <span>Escanear RF</span>
      </button>

      <label
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '0 12px',
          height: '100%',
          minHeight: '48px',
          borderRadius: '12px',
          border: '1px solid #cbd5e1',
          background: autoCamara ? '#e0f2fe' : '#ffffff',
          color: autoCamara ? '#0369a1' : '#475569',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
        title="Abre la cámara automáticamente al cambiar de factura"
      >
        <input
          type="checkbox"
          checked={autoCamara}
          onChange={(e) => onToggleAutoCamara(e.target.checked)}
          style={{ accentColor: '#0284c7' }}
        />
        <span>Auto</span>
      </label>
    </div>
  );
}

// === VISTA PRINCIPAL: CONTROL DE MUELLE (PICKING & PACKING) ===
export function VerificacionMuelleView({
  productos,
  facturas,
  onCambiarFacturas,
  auditorNombre,
  onRecargarDatos,
  onFacturaAuditada,
  onIrATrazabilidad,
  usuarioRol,
}: VerificacionMuelleViewProps) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [autoCamara, setAutoCamara] = useState(false);

  const muelle = useVerificacionMuelle({
    productos,
    facturas,
    onCambiarFacturas,
    auditorNombre,
    onRecargarDatos,
    onFacturaAuditada,
  });

  const facturaPendienteActiva =
    muelle.facturaActiva?.estado === 'pendiente'
      ? muelle.facturaActiva
      : muelle.facturasPendientes[0];

  const estaBloqueada = !facturaPendienteActiva;
  const puedeGestionarFacturas =
    usuarioRol === 'Administrador' || usuarioRol === 'Supervisor';
  const puedeUsarCamaraRf =
    usuarioRol === 'AuditorBodega' || usuarioRol === 'Supervisor';
  const colorFaltantes =
    muelle.resumenFactura.faltantes === 0 ? '#16a34a' : '#d97706';

  useEffect(() => {
    if (!camaraAbierta) return;
    const facturaCompleta =
      muelle.resumenFactura.todasCompletas && muelle.resumenFactura.totalPedido > 0;
    if (!facturaPendienteActiva || facturaCompleta) {
      setCamaraAbierta(false);
    }
  }, [
    camaraAbierta,
    facturaPendienteActiva,
    muelle.resumenFactura.todasCompletas,
    muelle.resumenFactura.totalPedido,
  ]);

  const handleSeleccionarFactura = (id: string) => {
    muelle.setFacturaSeleccionadaId(id);
    muelle.setUltimaAlertaTrocado(null);
    if (puedeUsarCamaraRf && autoCamara) {
      setCamaraAbierta(true);
    }
  };

  return (
    <>
      <div className="header-action">
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>
            Control de Muelle — Picking & Packing
          </h1>
          <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '14px' }}>
            Verificación RF contra factura para evitar trocados, faltantes o sobrantes antes del despacho
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {puedeGestionarFacturas && (
            <>
              <button
                type="button"
                disabled={estaBloqueada}
                onClick={muelle.reiniciarVerificacion}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: estaBloqueada ? 'not-allowed' : 'pointer',
                  opacity: estaBloqueada ? 0.5 : 1,
                }}
              >
                <RotateCcw size={16} />
                <span>Reiniciar conteo</span>
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={() => setModalAbierto(true)}
              >
                <Plus size={18} />
                <span>Nueva Factura</span>
              </button>
            </>
          )}
        </div>
      </div>

      {!facturaPendienteActiva ? (
        <EstadoSinPendientes
          puedeGestionarFacturas={puedeGestionarFacturas}
          totalAuditadas={muelle.facturasAuditadas.length}
          onIrATrazabilidad={onIrATrazabilidad}
        />
      ) : (
        <>
          <SelectorFacturaMuelle
            facturasPendientes={muelle.facturasPendientes}
            facturaActiva={facturaPendienteActiva}
            onSeleccionarFactura={handleSeleccionarFactura}
          />

          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-title">Unidades Facturadas</div>
              <div className="kpi-value">{muelle.resumenFactura.totalPedido}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-title">Unidades Pistoleadas</div>
              <div className="kpi-value" style={{ color: '#0284c7' }}>
                {muelle.resumenFactura.totalPistoleado}
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-title">Faltantes por Pistolear</div>
              <div className="kpi-value" style={{ color: colorFaltantes }}>
                {muelle.resumenFactura.faltantes}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'stretch',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: '250px' }}>
              <EscanerRfMuelle
                inputRef={muelle.inputScannerRef}
                codigoEscaneado={muelle.codigoEscaneado}
                deshabilitado={estaBloqueada}
                alertaTrocado={muelle.ultimaAlertaTrocado}
                onChangeCodigo={muelle.setCodigoEscaneado}
                onKeyDown={muelle.handleScannerKeyDown}
                onLimpiarAlerta={() => muelle.setUltimaAlertaTrocado(null)}
              />
            </div>

            {puedeUsarCamaraRf && (
              <ControlesCamaraRf
                deshabilitado={estaBloqueada}
                autoCamara={autoCamara}
                onAbrirCamara={() => {
                  muelle.setUltimaAlertaTrocado(null);
                  setCamaraAbierta(true);
                }}
                onToggleAutoCamara={setAutoCamara}
              />
            )}
          </div>

          <ChecklistMuelleTable
            facturaActiva={facturaPendienteActiva}
            productos={productos}
            todasCompletas={muelle.resumenFactura.todasCompletas}
            cerrandoPacking={muelle.cerrandoPacking}
            onConfirmarPacking={muelle.confirmarPackingYSalida}
          />
        </>
      )}

      <BitacoraIncidenciasMuelle incidencias={muelle.incidencias} />

      {puedeGestionarFacturas && (
        <ModalNuevaFacturaMuelle
          abierta={modalAbierto}
          productos={productos}
          onCerrar={() => setModalAbierto(false)}
          onCrearFactura={muelle.crearFacturaMuelle}
        />
      )}

      {puedeUsarCamaraRf && (
        <ModalEscanerCamara
          abierto={camaraAbierta}
          onCerrar={() => setCamaraAbierta(false)}
          onPistolearCodigo={(codigo) => {
            void muelle.procesarPistoleo(codigo);
          }}
        />
      )}
    </>
  );
}