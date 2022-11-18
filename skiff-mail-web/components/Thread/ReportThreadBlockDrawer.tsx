import { Drawer, Typography } from 'nightwatch-ui';
import { useDispatch } from 'react-redux';
import { DrawerOption, DrawerOptions } from 'skiff-front-utils';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';

export default function ReportThreadBlockDrawer() {
  const dispatch = useDispatch();
  const show = useAppSelector((state) => state.mobileDrawer.showReportThreadBlockDrawer);
  const options = useAppSelector((state) => state.mobileDrawer.reportThreadBlockOptions);
  const hideDrawer = () => dispatch(skemailMobileDrawerReducer.actions.setShowReportThreadBlockDrawer(false));
  return (
    <Drawer hideDrawer={hideDrawer} show={show} title='Report'>
      <DrawerOptions>
        {options.map((option) => (
          <DrawerOption
            key={option.label}
            onClick={(e) => {
              hideDrawer();
              option.onClick(e);
            }}
          >
            <Typography level={1}>{option.label}</Typography>
          </DrawerOption>
        ))}
      </DrawerOptions>
    </Drawer>
  );
}
