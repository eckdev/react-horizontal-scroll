/* eslint-disable react-hooks/rules-of-hooks */
import { useCallback, useEffect, useRef } from "react";

const style = {
  maxWidth: '100%',
  overflow: 'visible',
  display: 'inline-block',
  width: 'auto',
  transitionProperty: 'transform'
};
var dragOrigin = {
  x: 0,
  y: 0
};
var dragStartPosition = {
  x: 0,
  y: 0
};
var dragOffset = {
  x: 0,
  y: 0
};
var dragPosition = {
  x: 0,
  y: 0
};
var velocity = {
  x: 0,
  y: 0
};
var position = {
  x: 0,
  y: 0
};
var scrollOffset = {
  x: 0,
  y: 0
};
var isDragging = false;
var isRunning = false;
var isScrolling = false;
var rafID = 0;
var isTouch = false;
var edgeX = {};
var wheelTimer = null;
var isScrollEventWorked = false;
var allowClick = true;

const HorizontalScroll = ({ children }) => {
  const ref = useRef();
  const onMouseDown = (event) => {
    isDragging = true;
    isScrollEventWorked = false;
    allowClick = true;
    isTouch = !!(event.touches && event.touches[0]);
    dragOrigin.x = isTouch ? event.touches[0].pageX : event.pageX;
    dragOrigin.y = event.pageY;
    dragStartPosition.x = position.x;
    dragStartPosition.y = 0;
    setDragPosition(event);
    startAnimationLoop();

    if (!isTouch) {
      event.preventDefault();
    }
  };

  const animate = () => {
    if (!isRunning) {
      return;
    }

    updateScrollPosition();

    if (!isMoving()) {
      isRunning = false;
    }

    if (isScrollEventWorked) {
      const containerWidth = -ref.current.scrollWidth;
      let currentPosition = containerWidth + ref.current.clientWidth;

      if (position.x <= currentPosition) {
        position.x = currentPosition;
      }

      if (position.x >= 0) {
        position.x = 0;
      }
    }

    scrollingLeft(position.x);
    rafID = requestAnimationFrame(() => animate());
  };

  const startAnimationLoop = () => {
    isRunning = true;
    cancelAnimationFrame(rafID);
    rafID = requestAnimationFrame(() => animate());
  };

  const updateScrollPosition = () => {
    applyEdgeForce();
    applyDragForce();
    applyScrollForce();
    const inverseFriction = 1 - 0.05;
    velocity.x *= inverseFriction;
    velocity.y *= inverseFriction;
    position.x += velocity.x;
  };

  const applyDragForce = () => {
    if (!isDragging) {
      return;
    }

    const dragVelocity = {
      x: dragPosition.x - position.x,
      y: dragPosition.y - position.y,
    };
    applyForce({
      x: dragVelocity.x - velocity.x,
      y: dragVelocity.y - velocity.y,
    });
  };

  const applyForce = (force) => {
    velocity.x += force.x;
    velocity.y += force.y;
  };

  const setDragPosition = (event) => {
    if (!isDragging) {
      return;
    }

    const pageX = isTouch ? event.touches[0].pageX : event.pageX;
    const pageY = event.pageY;
    dragOffset.x = pageX - dragOrigin.x;
    dragOffset.y = pageY - dragOrigin.x;
    dragPosition.x = dragStartPosition.x + dragOffset.x;
    dragPosition.y = dragStartPosition.y + dragOffset.y;
  };

  const isMoving = () => {
    return isDragging || isScrolling || Math.abs(velocity.x) >= 0.01;
  };

  const applyEdgeForce = () => {
    if (isScrollEventWorked || isDragging) {
      return;
    }

    const beyondXFrom = position.x < edgeX.from;
    const beyondXTo = position.x > edgeX.to;
    const beyondX = beyondXFrom || beyondXTo;

    if (!beyondX) {
      return;
    }

    const edge = {
      x: beyondXFrom ? edgeX.from : edgeX.to,
    };
    const distanceToEdge = {
      x: edge.x - position.x,
    };
    const force = {
      x: distanceToEdge.x * 0.1,
    };
    const restPosition = {
      x: position.x + (velocity.x + force.x) / 0.05,
    };

    if (
      (beyondXFrom && restPosition.x >= edgeX.from) ||
      (beyondXTo && restPosition.x <= edgeX.to)
    ) {
      force.x = distanceToEdge.x * 0.1 - velocity.x;
    }

    applyForce({
      x: beyondX ? force.x : 0,
      y: 0,
    });
  };

  const applyScrollForce = () => {
    if (!isScrolling) {
      return;
    }

    applyForce({
      x: scrollOffset.x - velocity.x,
      y: scrollOffset.y - velocity.y,
    });
    scrollOffset.x = 0;
    scrollOffset.y = 0;
  };

  const onMouseMove = (event) => {
    allowClick = false;
    setDragPosition(event);
  };

  const onWheel = (event) => {
    if (edgeX.from === 0) {
      return;
    }

    velocity.x = 0;
    velocity.y = 0;
    isScrolling = true;
    isScrollEventWorked = true;
    scrollOffset.x = -event.deltaY;
    scrollOffset.y = -event.deltaX;
    startAnimationLoop();
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => (isScrolling = false), 80);
    event.preventDefault();
  };

  const scrollingLeft = (left) => {
    ref.current.style.transform = `translate3d(${left}px,0px,0px)`;
    ref.current.style.transitionDuration = "0ms";
  };

  const onMouseUp = (event) => {
    isDragging = false;
  };

  const onClick = (event) => {
    if (!allowClick) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const updateMetrics = useCallback(() => {
    let contentWidth = Math.max(
      ref.current.offsetWidth,
      ref.current.scrollWidth
    );
    edgeX = {
      from: Math.min(-contentWidth + ref.current.clientWidth, 0),
      to: 0,
    };
    startAnimationLoop();
  });

  const resize = useCallback(() => {
    updateMetrics();
  });

  useEffect(() => {
    ref.current.addEventListener("wheel", onwheel);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchend", onMouseUp);
    window.addEventListener("resize", resize);
    updateMetrics();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchend", onMouseUp);
      window.removeEventListener("resize", resize);
    };
  }, [resize,onMouseMove,onWheel,updateMetrics]);
  

  return (
    <div
      style={style}
      onTouchStart={onMouseDown}
      onMouseDown={onMouseDown}
      onClickCapture={onClick}
      ref={ref}
    >
      {children}
    </div>
  );
};

export default HorizontalScroll;
