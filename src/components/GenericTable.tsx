'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { RiArrowLeftSLine, RiArrowRightSLine } from '@remixicon/react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableRoot,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/common/Table';
import { Button } from '@/components/common/Button';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function GenericTable({
  pageNumber,
  tableSize,
  tableData,
  tableColumns,
  actions
}: {
  pageNumber: number;
  tableSize: number;
  tableData: Object[];
  tableColumns: Object[];
  actions?: { [key: string]: Function };
}) {
  const router = useRouter();
  const pageSize = tableData.length;
  const data = useMemo(() => tableData, [tableData]);

  const pageCount = Math.ceil(tableSize / pageSize);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount,
    state: {
      pagination: {
        pageIndex: pageNumber - 1,
        pageSize,
      },
    },
  });

  return (
    <TableRoot>
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
                  className={classNames(header.column.columnDef.meta?.align)}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHeaderCell>

              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="hover:bg-neutral-100 dark:hover:bg-neutral-700">
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className={classNames(cell.column.columnDef.meta?.align)}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="mt-10 flex items-center justify-between">
        <p className="text-tremor-default tabular-nums text-tremor-content dark:text-dark-tremor-content">
          Page{' '}
          <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
            {table.getState().pagination.pageIndex + 1}
          </span>{' '}
          of{' '}
          <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
            {pageCount}
          </span>
        </p>
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push(`?page=${pageNumber - 1}`)}
            disabled={pageNumber === 1}
          >
            <span className="sr-only">Previous</span>
            <RiArrowLeftSLine
              className="size-5 text-tremor-content-emphasis group-hover:text-tremor-content-strong dark:text-dark-tremor-content-emphasis group-hover:dark:text-dark-tremor-content-strong"
              aria-hidden={true}
            />
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push(`?page=${pageNumber + 1}`)}
            disabled={pageNumber >= pageCount}
          >
            <span className="sr-only">Next</span>
            <RiArrowRightSLine
              className="size-5 text-tremor-content-emphasis group-hover:text-tremor-content-strong dark:text-dark-tremor-content-emphasis group-hover:dark:text-dark-tremor-content-strong"
              aria-hidden={true}
            />
          </Button>
        </div>
      </div>
    </TableRoot>
  );
}
