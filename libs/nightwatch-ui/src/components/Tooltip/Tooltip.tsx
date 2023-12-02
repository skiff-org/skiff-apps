import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useDelayGroup,
  useDelayGroupContext,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole
} from '@floating-ui/react-dom-interactions';
import { AnimatePresence, motion } from 'framer-motion';
import * as React from 'react';
import styled from 'styled-components';

import { TooltipOptions, TooltipPlacement } from './Tooltip.constants';

const TooltipWrap = styled(motion.div)<{ $stateX: number | null; $stateY: number | null }>`
  width: max-content;
  max-width: 240px;
  position: absolute;
  top: 0;
  left: 0;
  background: var(--bg-emphasis);
  padding: 4px 8px;
  gap: 4px;
  border-radius: 8px;
  pointer-events: none;
  z-index: 9999999999;
  font-family: 'Skiff Sans Text', sans-serif !important;
  font-weight: 470;
  -webkit-font-smoothing: antialiased !important;
  font-size: 11px !important;
  line-height: 12px !important;
  color: var(--text-always-white) !important;
  overflow-wrap: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;

  top: ${(props) => props.$stateY ?? 0}px;
  left: ${(props) => props.$stateX ?? 0}px;
  visibility: ${(props) => (props.$stateX ? 'visible' : 'hidden')};
`;

const StyledTooltipTrigger = styled.span<{ $fullWidth: boolean }>`
  display: flex;
  ${(props) => props.$fullWidth && 'width: 100%;'}
`;

function useTooltip({
  initialOpen = false,
  placement = TooltipPlacement.TOP,
  open: controlledOpen,
  onOpenChange: setControlledOpen
}: TooltipOptions = {}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(initialOpen);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;

  const { delay } = useDelayGroupContext();

  const data = useFloating({
    placement,
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    middleware: [offset(5), flip(), shift()]
  });

  const context = data.context;

  const hover = useHover(context, {
    enabled: controlledOpen == null,
    delay
  });

  const focus = useFocus(context, {
    enabled: controlledOpen == null
  });
  const dismiss = useDismiss(context, {
    referencePress: true,
    outsidePress: true
  });
  const role = useRole(context, { role: 'tooltip' });

  const interactions = useInteractions([hover, focus, dismiss, role]);

  return React.useMemo(
    () => ({
      open,
      setOpen,
      ...interactions,
      ...data
    }),
    [open, setOpen, interactions, data]
  );
}

type ContextType = ReturnType<typeof useTooltip> | null;

const TooltipContext = React.createContext<ContextType>(null);

const useTooltipState = () => {
  const context = React.useContext(TooltipContext);

  if (context == null) {
    console.error('Tooltip components must be wrapped in <Tooltip />');
  }

  return context;
};

export default function Tooltip({ children, ...options }: { children: React.ReactNode } & TooltipOptions) {
  // This can accept any props as options, e.g. `placement`,
  // or other positioning options.
  const tooltip = useTooltip(options);
  return <TooltipContext.Provider value={tooltip}>{children}</TooltipContext.Provider>;
}

export const TooltipTrigger = React.forwardRef<
  HTMLElement,
  React.HTMLProps<HTMLElement> & { asChild?: boolean; fullWidth?: boolean }
>(function TooltipTrigger({ children, asChild = false, fullWidth = false, ...props }, propRef) {
  const state = useTooltipState();

  const childrenRef = (children as React.HTMLProps<HTMLElement>).ref as React.RefObject<HTMLElement>;

  if (!state) return null;

  // `asChild` allows the user to pass any element as the anchor
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children,
      state.getReferenceProps({
        ref: childrenRef,
        ...props,
        ...children.props,
        'data-state': state.open ? 'open' : 'closed'
      } as React.HTMLProps<Element> | undefined)
    );
  }

  return (
    <StyledTooltipTrigger
      ref={state?.reference || propRef}
      // The user can style the trigger based on the state
      data-state={state.open ? 'open' : 'closed'}
      {...state.getReferenceProps(props)}
      $fullWidth={fullWidth}
    >
      {children}
    </StyledTooltipTrigger>
  );
});

export const TooltipContent = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(function TooltipContent(
  props,
  propRef
) {
  const state = useTooltipState();
  const { context } = useFloating();
  const { delay, setCurrentId } = useDelayGroupContext();

  useDelayGroup(state?.context || context, {
    id: props.children
  });

  // props.children should be primitive (e.g. string)
  React.useLayoutEffect(() => {
    if (!state) return;
    if (state.open) {
      setCurrentId(props.children);
    }
  }, [state?.open, props.children, setCurrentId]);

  if (!state) return null;
  if (!props.children) return null;

  return (
    <FloatingPortal>
      <AnimatePresence>
        {state.open && (
          <TooltipWrap
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={
              // When in "grouped phase", make the transition faster
              // The open delay becomes 1ms during this phase.
              typeof delay === 'object' && delay.open === 1
                ? { duration: 0.08 }
                : { type: 'tween', delay: 0, duration: 0.2, ease: [0.96, 0.23, 0, 0.96] }
            }
            ref={state?.floating || propRef}
            $stateX={state.x}
            $stateY={state.y}
            {...state.getFloatingProps(props)}
          />
        )}
      </AnimatePresence>
    </FloatingPortal>
  );
});
