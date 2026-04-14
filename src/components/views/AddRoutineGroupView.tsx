import React from 'react';
import { AddRoutineGroupViewProps } from '../../types';
import { RoutineGroupFormView } from './RoutineGroupFormView';

export const AddRoutineGroupView: React.FC<AddRoutineGroupViewProps> = (props) => {
  return <RoutineGroupFormView {...props} mode="add" />;
};
