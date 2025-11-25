import React from 'react';

export const Filter = ({ column } : any) => {
  return (
    <div style={{ marginTop: 5 }}>
      {column.canFilter && column.render('Filter')}
    </div>
  );
};

interface DefaultColumnProps {
  column ?: any;
  filterValue ?: any;
  setFilter ?: any;
  preFilteredRows ?: any;
}

export const DefaultColumnFilter = ({
  column: {
    filterValue,
    setFilter,
    preFilteredRows: { length },
  },
} : DefaultColumnProps ) => {
  return (
    <input
      value={filterValue || ''}
      onChange={(e : any) => {
        setFilter(e.target.value || undefined);
      }}
      placeholder={`search (${length}) ...`}
    />
  );
};
