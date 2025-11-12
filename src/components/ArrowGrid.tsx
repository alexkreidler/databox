import DataEditor, {
  CompactSelection,
  // DataEditorContainer,
  type DataEditorProps,
  type GridCell,
  GridCellKind,
  type GridColumn,
  GridColumnIcon,
  type Rectangle,
} from "@glideapps/glide-data-grid";
import React from "react";
import { DataType, type Field, type Table } from "apache-arrow";

import "@glideapps/glide-data-grid/dist/index.css";

const showNullColumns = false;

// TODO: use different icons to distinguish from Glide?
function convertArrowTypeToDataGridIcon(type: DataType): GridColumnIcon {
  if (DataType.isUtf8(type)) {
    return GridColumnIcon.HeaderString;
  }
  if (
    DataType.isInt(type) ||
    DataType.isFloat(type) ||
    DataType.isDecimal(type)
  ) {
    return GridColumnIcon.HeaderNumber;
  }
  if (DataType.isBool(type)) {
    return GridColumnIcon.HeaderBoolean;
  }
  if (DataType.isDate(type)) {
    return GridColumnIcon.HeaderDate;
  }
  if (
    DataType.isTime(type) ||
    DataType.isTimestamp(type) ||
    DataType.isInterval(type)
  ) {
    return GridColumnIcon.HeaderTime;
  }
  if (DataType.isNull(type)) {
    return GridColumnIcon.HeaderSingleValue;
  }
  return GridColumnIcon.HeaderString;
}

type GridCoordinate = readonly [number, number];

const DEFAULT_DIMS = { height: 400, width: 1200 };

function formatNumberWithCommas(n: number, digits: number = 2): string {
  if (n == 0) {
    return "0";
  }
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

// TODO: also handle timestamps
function formatArrowValue(value: any, type: DataType): string {
  if (DataType.isInt(type) || DataType.isFloat(type)) {
    return formatNumberWithCommas(Number(value));
  }
  if (DataType.isDecimal(type)) {
    // Decimal values are stored as integers scaled by 10^scale
    // Need to divide by 10^scale to get the actual decimal value
    const scaledValue = Number(value) / Math.pow(10, type.scale);
    return formatNumberWithCommas(scaledValue);
  }
  return value.toString();
}

export const ArrowGrid: React.FC<
  {
    table: Table;
    gridProps?: Partial<DataEditorProps>;
    getCellBgColor?: (coord: GridCoordinate) => string;
    getCellOverlayData?: (coord: GridCoordinate) => any;
    dimensions?: Pick<Rectangle, "width" | "height">;
  } & React.HTMLAttributes<HTMLDivElement>
> = ({
  table,
  gridProps,
  getCellBgColor,
  getCellOverlayData,
  dimensions = DEFAULT_DIMS,
  ...props
}) => {
  if (!table) return;
  if (!showNullColumns) {
    table = table.select(
      table.schema.fields
        .filter((c) => !DataType.isNull(c.type))
        .map((c) => c.name)
    );
  }

  function getCellContent([col, row]: readonly [number, number]): GridCell {
    let value =
      getCellOverlayData?.([col, row]) ?? table.getChildAt(col)?.get(row) ?? "";

    if (DataType.isDate(table.getChildAt(col)?.type) && value) {
      // format arrow value as ISO date
      try {
        value = new Date(value).toISOString().split("T")[0];
      } catch (error) {
        console.warn("Failed to parse date + ", value);
      }
    }

	const data = formatArrowValue(value, table.getChildAt(col)?.type);
    return {
      kind: GridCellKind.Text,
      data: data,
      displayData: data,
      themeOverride: {
        // Can't tell why border color doesn't do anything
        borderColor: "#00ff51",
        // It's because `drawGridLines` happens once for
        // all the cells, using the main theme, not cell-specific
        // mentioned in the multiple highlight issue

        // // bgCell: "blue",
        // drilldownBorder: "#00ff51",
        bgCell: getCellBgColor?.([col, row]) ?? "#fff",

        // bgCell: "rgba(236,168,25,0.2)"
      },
      allowOverlay: true,
      readonly: false,
    };
  }

  function convertToGridColumns(field: Field, index: number): GridColumn {
    // TODO: filter columns where all fields are empty but doesn't
    // return a null arrow data type
    if (DataType.isNull(field.type) && !showNullColumns) {
      console.warn("Shouldn't have null column", field);
    }
    return {
      id: field.name,
      // @ts-ignore
      width:
        10 +
        10 *
          Math.min(
            30,
            Math.max(
              (getCellContent([index, 0]) as any)?.data?.length || 0,
              Math.max(field.name.length, 6)
            )
          ),
      title: field.name,
      hasMenu: true,
      icon: convertArrowTypeToDataGridIcon(field.type),
    };
  }

  const [menu, setMenu] = React.useState<{
    col: number;
    bounds: Rectangle;
  }>();

  // SELECTEDROWS: Not needed for local functionality, maybe needed to sync remotely
  const [selectedRows, setSelectedRows] = React.useState(
    CompactSelection.empty()
  );

  const { height, width } = dimensions;

  return (
    <DataEditor
      width={width}
      height={height}
      getCellContent={getCellContent}
      // copy
      getCellsForSelection={true}
      // paste
      onPaste={true}
      columns={table.schema.fields.map(convertToGridColumns).filter(Boolean)}
      rows={table.numRows}
      rowMarkers="both"
      {...gridProps}
    />
  );
};
