import { Drawer, Typography } from '@skiff-org/skiff-ui';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { DrawerOption, DrawerOptions } from '../shared/DrawerOptions';

export default function ReportThreadBlockDrawer() {
  const dispatch = useDispatch();
  const show = useAppSelector((state) => state.mobileDrawer.showReportThreadBlockDrawer);
  const options = useAppSelector((state) => state.mobileDrawer.reportThreadBlockOptions);
  const hideDrawer = () => dispatch(skemailMobileDrawerReducer.actions.setShowReportThreadBlockDrawer(false));
  return (
    <Drawer show={show} hideDrawer={hideDrawer} title='Report'>
      <DrawerOptions>
        {options.map((option) => {
          return (
            <DrawerOption key={option.label} onClick={option.onClick}>
              <Typography type='paragraph' level={1}>
                {option.label}
              </Typography>
            </DrawerOption>
          );
        })}
      </DrawerOptions>
    </Drawer>
  );
}
