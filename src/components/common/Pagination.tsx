import { useMemo } from 'react';
import { RiArrowLeftSLine, RiArrowRightSLine } from '@remixicon/react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react';

// This example requires @tanstack/react-table

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const workspaces = [
  {
    workspace: 'sales_by_day_api',
    owner: 'John Doe',
    status: 'live',
    costs: '$3,509.00',
    region: 'US-West 1',
    capacity: '99%',
    lastEdited: '23/09/2023 13:00',
  },
  {
    workspace: 'marketing_campaign',
    owner: 'Jane Smith',
    status: 'live',
    costs: '$5,720.00',
    region: 'US-East 2',
    capacity: '80%',
    lastEdited: '22/09/2023 10:45',
  },
  {
    workspace: 'sales_campaign',
    owner: 'Jane Smith',
    status: 'live',
    costs: '$5,720.00',
    region: 'US-East 2',
    capacity: '80%',
    lastEdited: '22/09/2023 10:45',
  },
  {
    workspace: 'development_env',
    owner: 'Mike Johnson',
    status: 'live',
    costs: '$4,200.00',
    region: 'EU-West 1',
    capacity: '60%',
    lastEdited: '21/09/2023 14:30',
  },
  {
    workspace: 'new_workspace_1',
    owner: 'Alice Brown',
    status: 'live',
    costs: '$2,100.00',
    region: 'US-West 2',
    capacity: '75%',
    lastEdited: '24/09/2023 09:15',
  },
  {
    workspace: 'test_environment',
    owner: 'David Clark',
    status: 'inactive',
    costs: '$800.00',
    region: 'EU-Central 1',
    capacity: '40%',
    lastEdited: '25/09/2023 16:20',
  },
  {
    workspace: 'analytics_dashboard',
    owner: 'Sarah Wilson',
    status: 'live',
    costs: '$6,500.00',
    region: 'US-West 1',
    capacity: '90%',
    lastEdited: '26/09/2023 11:30',
  },
  {
    workspace: 'research_project',
    owner: 'Michael Adams',
    status: 'live',
    costs: '$3,900.00',
    region: 'US-East 1',
    capacity: '70%',
    lastEdited: '27/09/2023 08:45',
  },
  {
    workspace: 'training_environment',
    owner: 'Laura White',
    status: 'live',
    costs: '$2,500.00',
    region: 'EU-North 1',
    capacity: '55%',
    lastEdited: '28/09/2023 12:15',
  },
];

const workspacesColumns = [
  {
    header: 'Workspace',
    accessorKey: 'workspace',
    meta: {
      align: 'text-left',
    },
  },
  {
    header: 'Owner',
    accessorKey: 'owner',
    meta: {
      align: 'text-left',
    },
  },
  {
    header: 'Status',
    accessorKey: 'status',
    meta: {
      align: 'text-left',
    },
  },
  {
    header: 'Region',
    accessorKey: 'region',
    meta: {
      align: 'text-left',
    },
  },
  {
    header: 'Capacity',
    accessorKey: 'capacity',
    meta: {
      align: 'text-right',
    },
  },
  {
    header: 'Costs',
    accessorKey: 'costs',
    meta: {
      align: 'text-right',
    },
  },
  {
    header: 'Last edited',
    accessorKey: 'lastEdited',
    meta: {
      align: 'text-right',
    },
  },
];

const Button = ({ onClick, disabled, children }) => {
  return (
    <button
      type="button"
      className="group px-2.5 py-2 text-tremor-default disabled:cursor-not-allowed disabled:opacity-50"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default function Example() {
  const pageSize = 8;

  const data = useMemo(
    // multiply dummy data to better demonstrate pagination over several pages
    () => [...workspaces, ...workspaces, ...workspaces, ...workspaces],
    [],
  );
  const table = useReactTable({
    data: data,
    columns: workspacesColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: pageSize,
      },
    },
  });

  return (
    <>
      <Table>
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="border-b border-tremor-border dark:border-dark-tremor-border"
            >
              {headerGroup.headers.map((header) => (
                <TableHeaderCell
                  key={header.id}
                  scope="col"
                  className={classNames(header.column.columnDef.meta.align)}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </TableHeaderCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={classNames(cell.column.columnDef.meta.align)}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-10 flex items-center justify-between">
        <p className="text-tremor-default tabular-nums text-tremor-content dark:text-dark-tremor-content">
          Page{' '}
          <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">{`${
            table.getState().pagination.pageIndex + 1
          }`}</span>{' '}
          of
          <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
            {' '}
            {`${table.getPageCount()}`}
          </span>
        </p>
        <div className="inline-flex items-center rounded-tremor-full shadow-tremor-input ring-1 ring-inset ring-tremor-ring dark:shadow-dark-tremor-input dark:ring-dark-tremor-ring">
          <Button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Previous</span>
            <RiArrowLeftSLine
              className="size-5 text-tremor-content-emphasis group-hover:text-tremor-content-strong dark:text-dark-tremor-content-emphasis group-hover:dark:text-dark-tremor-content-strong"
              aria-hidden={true}
            />
          </Button>
          <span
            className="h-5 border-r border-tremor-border dark:border-dark-tremor-border"
            aria-hidden={true}
          />
          <Button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Next</span>
            <RiArrowRightSLine
              className="size-5 text-tremor-content-emphasis group-hover:text-tremor-content-strong dark:text-dark-tremor-content-emphasis group-hover:dark:text-dark-tremor-content-strong"
              aria-hidden={true}
            />
          </Button>
        </div>
      </div>
    </>
  );
}