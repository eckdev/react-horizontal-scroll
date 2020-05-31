import React, { Component } from 'react';
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
export default class HorizontalScroll extends Component {
  constructor(props) {
    super(props);
    this.ref = /*#__PURE__*/React.createRef();
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
  }

  onMouseDown(event) {
    isDragging = true;
    isScrollEventWorked = false;
    allowClick = true;
    isTouch = !!(event.touches && event.touches[0]);
    dragOrigin.x = isTouch ? event.touches[0].pageX : event.pageX;
    dragOrigin.y = event.pageY;
    dragStartPosition.x = position.x;
    dragStartPosition.y = 0;
    this.setDragPosition(event);
    this.startAnimationLoop();

    if (!isTouch) {
      event.preventDefault();
    }
  }

  animate() {
    if (!isRunning) {
      return;
    }

    this.updateScrollPosition();

    if (!this.isMoving()) {
      isRunning = false;
    }

    if (isScrollEventWorked) {
      const containerWidth = -this.ref.current.scrollWidth;
      let currentPosition = containerWidth + this.ref.current.clientWidth;

      if (position.x <= currentPosition) {
        position.x = currentPosition;
      }

      if (position.x >= 0) {
        position.x = 0;
      }
    }

    this.scrollingLeft(position.x);
    rafID = requestAnimationFrame(() => this.animate());
  }

  startAnimationLoop() {
    isRunning = true;
    cancelAnimationFrame(rafID);
    rafID = requestAnimationFrame(() => this.animate());
  }

  updateScrollPosition() {
    this.applyEdgeForce();
    this.applyDragForce();
    this.applyScrollForce();
    const inverseFriction = 1 - 0.05;
    velocity.x *= inverseFriction;
    velocity.y *= inverseFriction;
    position.x += velocity.x;
  }

  applyDragForce() {
    if (!isDragging) {
      return;
    }

    const dragVelocity = {
      x: dragPosition.x - position.x,
      y: dragPosition.y - position.y
    };
    this.applyForce({
      x: dragVelocity.x - velocity.x,
      y: dragVelocity.y - velocity.y
    });
  }

  applyForce(force) {
    velocity.x += force.x;
    velocity.y += force.y;
  }

  setDragPosition(event) {
    if (!isDragging) {
      return;
    }

    const pageX = isTouch ? event.touches[0].pageX : event.pageX;
    const pageY = event.pageY;
    dragOffset.x = pageX - dragOrigin.x;
    dragOffset.y = pageY - dragOrigin.x;
    dragPosition.x = dragStartPosition.x + dragOffset.x;
    dragPosition.y = dragStartPosition.y + dragOffset.y;
  }

  isMoving() {
    return isDragging || isScrolling || Math.abs(velocity.x) >= 0.01;
  }

  applyEdgeForce() {
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
      x: beyondXFrom ? edgeX.from : edgeX.to
    };
    const distanceToEdge = {
      x: edge.x - position.x
    };
    const force = {
      x: distanceToEdge.x * 0.1
    };
    const restPosition = {
      x: position.x + (velocity.x + force.x) / 0.05
    };

    if (beyondXFrom && restPosition.x >= edgeX.from || beyondXTo && restPosition.x <= edgeX.to) {
      force.x = distanceToEdge.x * 0.1 - velocity.x;
    }

    this.applyForce({
      x: beyondX ? force.x : 0,
      y: 0
    });
  }

  applyScrollForce() {
    if (!isScrolling) {
      return;
    }

    this.applyForce({
      x: scrollOffset.x - velocity.x,
      y: scrollOffset.y - velocity.y
    });
    scrollOffset.x = 0;
    scrollOffset.y = 0;
  }

  onMouseMove(event) {
    allowClick = false;
    this.setDragPosition(event);
  }

  onWheel(event) {
    if (edgeX.from === 0) {
      return;
    }

    velocity.x = 0;
    velocity.y = 0;
    isScrolling = true;
    isScrollEventWorked = true;
    scrollOffset.x = -event.deltaY;
    scrollOffset.y = -event.deltaX;
    this.startAnimationLoop();
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => isScrolling = false, 80);
    event.preventDefault();
  }

  scrollingLeft(left) {
    this.ref.current.style.transform = `translate3d(${left}px,0px,0px)`;
    this.ref.current.style.transitionDuration = '0ms';
  }

  onMouseUp(event) {
    isDragging = false;
  }

  onClick(event) {
    if (!allowClick) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  updateMetrics() {
    let contentWidth = Math.max(this.ref.current.offsetWidth, this.ref.current.scrollWidth);
    edgeX = {
      from: Math.min(-contentWidth + this.ref.current.clientWidth, 0),
      to: 0
    };
    this.startAnimationLoop();
  }

  resize() {
    this.updateMetrics();
  }

  componentDidMount() {
    this.ref.current.addEventListener('wheel', this.onWheel);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('touchmove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('touchend', this.onMouseUp);
    window.addEventListener('resize', this.resize);
    this.updateMetrics();
  }

  componentWillMount() {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('touchmove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('touchend', this.onMouseUp);
    window.removeEventListener('resize', this.resize);
  }

  render() {
    const {
      children
    } = this.props;
    return /*#__PURE__*/React.createElement("div", {
      style: style,
      ref: this.ref,
      onTouchStart: this.onMouseDown,
      onMouseDown: this.onMouseDown,
      onClickCapture: this.onClick
    }, children);
  }

}
