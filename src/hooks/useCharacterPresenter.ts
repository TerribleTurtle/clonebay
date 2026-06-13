import { CharacterStatus, StatusLight } from '../store/useCharacterStore';
import { IndicatorStatus } from '../components/ui/CharacterStatusBoard';

export function mapStatus(s: StatusLight): IndicatorStatus {
  switch (s) {
    case 'Green': return 'green';
    case 'Yellow': return 'yellow';
    case 'Red': return 'red';
    case 'Offline':
    default: return 'offline';
  }
}

export function useCharacterPresenter(status: CharacterStatus | undefined, characterId: string) {
  if (!status) {
    return null;
  }

  const displayName = status.name || characterId;
  const locationText = status.locationName || (status.location?.solar_system_id ? String(status.location.solar_system_id) : 'UNKNOWN SYSTEM');

  const isk = typeof status.isk === 'number' ? status.isk.toLocaleString() : '---';
  const totalSp = typeof status.totalSp === 'number' ? (status.totalSp + (status.unallocatedSp || 0)).toLocaleString() : '---';

  const clonesCount = status.clones ? status.clones.jump_clones.length : 0;
  const maxClones = status.maxClones || 0;
  const fatigueTimer = status.fatigue?.jump_fatigue_expire_date 
    ? new Date(status.fatigue.jump_fatigue_expire_date).toLocaleString() 
    : '00:00:00';
  const activeShip = status.ship?.ship_name ?? 'Capsule';
  const activeOrders = status.marketOrders ? (Array.isArray(status.marketOrders) ? status.marketOrders.length : status.marketOrders.count) : 0;
  const unreadMail = status.mail?.total_unread_count !== undefined ? status.mail.total_unread_count : 0;

  const statuses = {
    skill: mapStatus(status.skills),
    pi: mapStatus(status.pi),
    indy: mapStatus(status.industry),
    mail: mapStatus(status.mailStatus),
    war: mapStatus(status.warStatus)
  };

  const alerts = {
    skill: status.skillsContext?.queue,
    pi: status.piContext?.alerts,
    indy: status.indyContext?.alerts,
    mail: status.mailContext?.unreadSubjects,
    war: status.warContext?.alerts
  };

  const metricsContexts = {
    clonesContext: status.clonesContext,
    fatigueContext: status.fatigue?.jump_fatigue_expire_date ? { jumpFatigueExpireDate: status.fatigue.jump_fatigue_expire_date } : undefined,
    shipContext: status.ship ? { shipName: status.ship.ship_name, typeName: status.ship.ship_type_id.toString() } : undefined,
    ordersContext: status.ordersContext ? status.ordersContext.topOrders.map(o => ({ typeName: o })) : undefined,
    mailContext: status.mailContext ? status.mailContext.unreadSubjects.map(s => ({ subject: s })) : undefined,
  };

  return {
    displayName,
    locationText,
    isk,
    totalSp,
    clonesCount,
    maxClones,
    fatigueTimer,
    activeShip,
    activeOrders,
    unreadMail,
    statuses,
    alerts,
    metricsContexts,
    stationName: status.stationName,
    structureId: status.structureId,
  };
}
