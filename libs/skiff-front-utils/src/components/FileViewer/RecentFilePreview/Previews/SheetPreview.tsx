import { ThemeMode, Typography, getThemedColor } from 'nightwatch-ui';
import { useEffect, useState } from 'react';
import styled, { css } from 'styled-components';

import { isMobile } from 'react-device-detect';
import { PreviewComponent, PreviewComponentProps } from '../RecentFilePreview.types';

const SheetPreviewContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 100%;
  height: calc(84vh - 51px);
  place-content: flex-start;
`;

const Table = styled.table`
  margin: 0;
  border-spacing: 0;
  border-collapse: collapse;
  height: 100%;
  table-layout: fixed;
  ${isMobile &&
  css`
    overflow: auto;
  `}
  ${!isMobile &&
  css`
    overflow: hidden;
    :hover {
      overflow: auto;
    }
  `}
  width: 100%;
  place-self: flex-start;
`;

const TableData = styled.td`
  border: 1px solid ${getThemedColor('var(--border-secondary)', ThemeMode.DARK)};
  height: 100%;
  text-align: center;
  vertical-align: middle;
  width: 100px;
  padding: 4px;
`;

const MAX_ROWS = 1000;
const MAX_COLS = 1000;

const SheetPreview: PreviewComponent = ({ data }: PreviewComponentProps) => {
  const [rows, setRows] = useState<Array<Array<any>>>([]);
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(() => {
    const getPreview = async () => {
      let buf: ArrayBuffer | undefined = undefined;
      if (data.startsWith('blob:')) {
        const res = await fetch(data);
        const blob = await res.blob();
        buf = await blob.arrayBuffer();
      } else if (data.startsWith('data:')) {
        const byteString = window.atob(data.split(',')[1] ?? '');
        // separate out the mime component
        // write the bytes of the string to an ArrayBuffer
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        // set the bytes of the buffer to the correct values
        for (let idx = 0; idx < byteString.length; idx++) {
          ia[idx] = byteString.charCodeAt(idx);
        }
        buf = ab;
      }
      if (!buf) {
        console.error('Sheet preview failed');
        return;
      }

      const Excel = await import('exceljs');
      const workbook = new Excel.Workbook();
      const loadedSheet = await workbook.xlsx.load(buf);
      const worksheet = loadedSheet.worksheets[0];
      const rowsArray: any[][] = [];

      const { Parser } = await import('hot-formula-parser');
      const parser = new Parser();
      parser.on('callCellValue', function (cellCoord: any, done: (value: any) => void) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        const possibleFormula = worksheet.getCell(cellCoord.label).formula;
        if (possibleFormula) {
          const formulaResult = parser.parse(possibleFormula).result;
          done(formulaResult);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          const cellValue = worksheet.getCell(cellCoord.label).value;
          done(cellValue ?? 0);
        }
      });

      worksheet.eachRow((row) => {
        const cellArray: any[] = [];
        row.eachCell((cell) => {
          if (typeof cell.value === 'object' && cell.value !== null) {
            try {
              // try parsing formula as number
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              const formulaNum = Number(cell.value.formula);
              if (!Number.isNaN(formulaNum)) {
                cellArray.push(formulaNum);
                return;
              }
            } catch (error) {}
            try {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
              const formula = parser.parse(cell.value.formula).result;
              if (typeof formula === 'number') {
                cellArray.push(formula);
                return;
              }
            } catch (error) {
              console.log('error parsing formula', error);
            }
            // or, evaluate formula in future
            cellArray.push(0);
          } else if (typeof cell.value === 'string' || typeof cell.value === 'number') {
            cellArray.push(cell.value);
          } else {
            cellArray.push('');
          }
        });
        rowsArray.push(cellArray);
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
      const limitedRows = rowsArray.slice(0, MAX_ROWS).map((row) => row.slice(0, MAX_COLS));
      setRows(limitedRows);
    };
    const getPreviewWithFallback = async () => {
      try {
        await getPreview();
      } catch (error) {
        console.log('Error parsing', error);
        setPreviewFailed(true);
      }
    };
    void getPreviewWithFallback();
  }, [data]);

  const maxNumberOfColumns = rows.reduce((max, row) => Math.max(max, row.length), 0);

  return (
    <SheetPreviewContainer>
      {previewFailed && <Typography>Preview failed</Typography>}
      {rows.length > 0 && (
        <Table>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: maxNumberOfColumns }).map((_, cellIndex) => (
                  <TableData key={cellIndex}>
                    <Typography forceTheme={ThemeMode.DARK}>{row[cellIndex]}</Typography>
                  </TableData>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </SheetPreviewContainer>
  );
};

export default SheetPreview;
