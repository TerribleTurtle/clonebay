import { useMemo } from 'react';
import { CharacterStatus, StatusLight } from '../store/slices/types';

export type PresenterStatus = 'green' | 'yellow' | 'red' | 'offline';

export function mapStatus(s: StatusLight): PresenterStatus {
  switch (s) {
    case 'Green': return 'green';
    case 'Yellow': return 'yellow';
    case 'Red': return 'red';
    case 'Offline':
    default: return 'offline';
  }
}

export function useCharacterPresenter(status: CharacterStatus | undefined, characterId: string) {
  const clonesContext = status?.clonesContext;
  const clonesContextGroups = useMemo(() => {
    if (!clonesContext) return undefined;
    const grouped: Record<string, typeof clonesContext[0] & { count: number }> = {};
    clonesContext.forEach(clone => {
      const key = clone.locationName;
      if (!grouped[key]) grouped[key] = { ...clone, count: 0 };
      grouped[key].count++;
    });
    return Object.values(grouped);
  }, [clonesContext]);

  const ordersContextRaw = status?.ordersContext;
  const ordersContext = useMemo(() => {
    return ordersContextRaw ? ordersContextRaw.topOrders.map(o => ({ typeName: o })) : undefined;
  }, [ordersContextRaw]);

  const mailContextRaw = status?.mailContext;
  const mailContext = useMemo(() => {
    return mailContextRaw ? mailContextRaw.unreadSubjects.map(s => ({ subject: s })) : undefined;
  }, [mailContextRaw]);

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



  const metrics = {
    clonesCount,
    maxClones,
    clonesContext: clonesContextGroups,
    fatigueTimer,
    fatigueContext: status.fatigue?.jump_fatigue_expire_date ? { jumpFatigueExpireDate: status.fatigue.jump_fatigue_expire_date } : undefined,
    activeShip,
    shipContext: status.ship ? { shipName: status.ship.ship_name, typeName: status.ship.ship_type_id.toString() } : undefined,
    activeOrders,
    ordersContext,
    unreadMail,
    mailContext,
  };

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

  return {
    displayName,
    locationText,
    isk,
    totalSp,
    metrics,
    statuses,
    alerts,
    stationName: status.stationName,
    structureId: status.structureId,
  };
}
