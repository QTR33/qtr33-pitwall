import React from 'react';
import { RacingSeriesId, REGISTERED_SERIES } from '@livetiming/shared';
import { Tabs } from '../../common/Tabs.js';

export interface SeriesSelectorProps {
  activeSeries: RacingSeriesId;
  onSelectSeries: (seriesId: RacingSeriesId) => void;
}

export const SeriesSelector: React.FC<SeriesSelectorProps> = ({ activeSeries, onSelectSeries }) => {
  return (
    <Tabs
      tabs={REGISTERED_SERIES.map((series) => ({ id: series.id, label: series.name }))}
      activeTab={activeSeries}
      onChange={(id) => onSelectSeries(id as RacingSeriesId)}
    />
  );
};
