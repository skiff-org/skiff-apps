// The number of levels the parent node is from the root.
// If this position points directly into the root node, it is 0.
// If it points into a top-level paragraph, 1, and so on.
interface DepthByType {
  paragraph: number;
  table: number;
  ordered_list: number;
  bullet_list: number;
  heading: number;
  table_row: number;
  table_cell: number;
  table_header: number;
}
const depthByType: DepthByType = {
  paragraph: 1,
  table: 1,
  ordered_list: 1,
  bullet_list: 1,
  heading: 1,
  table_row: 2,
  table_cell: 3,
  table_header: 3
};
export default depthByType;
