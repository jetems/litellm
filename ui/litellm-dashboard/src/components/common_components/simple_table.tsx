import React from "react";
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Text } from "@tremor/react";
import { useTranslate } from "@/i18n";

export interface SimpleTableColumn<T> {
  header: string;
  accessor?: keyof T;
  cell?: (row: T) => React.ReactNode;
  width?: string;
}

interface SimpleTableProps<T> {
  data: T[];
  columns: SimpleTableColumn<T>[];
  isLoading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  getRowKey?: (row: T, index: number) => string;
}

/**
 * Simple table component for forms and settings pages
 * For complex tables with sorting/filtering, use DataTable from view_logs
 */
export function SimpleTable<T>({
  data,
  columns,
  isLoading = false,
  loadingMessage,
  emptyMessage,
  getRowKey,
}: SimpleTableProps<T>) {
  const t = useTranslate();
  const displayLoadingMessage = loadingMessage || t("Loading...");
  const displayEmptyMessage = emptyMessage || t("No data");
  return (
    <Table>
      <TableHead>
        <TableRow>
          {columns.map((column, index) => (
            <TableHeaderCell key={index} style={{ width: column.width }}>
              {column.header}
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center">
              <Text className="text-gray-500">{displayLoadingMessage}</Text>
            </TableCell>
          </TableRow>
        ) : data.length > 0 ? (
          data.map((row, rowIndex) => (
            <TableRow key={getRowKey ? getRowKey(row, rowIndex) : rowIndex}>
              {columns.map((column, colIndex) => (
                <TableCell key={colIndex}>
                  {column.cell ? column.cell(row) : String(row[column.accessor as keyof T] ?? "")}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center">
              <Text className="text-gray-500">{displayEmptyMessage}</Text>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

