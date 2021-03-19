import React, { useState } from 'react';
import Toast from 'react-bootstrap/Toast';

import { APP_NAME } from '../../Constants';

const defaultProps = {
  variant: 'success', // error, exception, missing
  show: false,
  delay: 5000,
  title: APP_NAME,
  body: ``,
};

export default function ToastNotification(props) {
  const [show, setShow] = useState(props.show);

  const getColor = (variant) => {
    const colors = {
      success: `var(--success)`,
      error: `var(--warning)`,
      exception: `var(--danger)`,
      missing: `var(--info)`,
    };
    return colors[variant]
      ? `rgba(${colors[variant]}, 0.5) !important`
      : `inherit`;
  };

  return (
    <div style={{ position: 'relative' }}>
      <Toast
        style={{
          backgroundColor: getColor(props.variant),
          position: 'absolute',
          top: 0,
          right: 0,
          minWidth: '250px',
        }}
        show={show}
        className="bg-success"
        onClose={() => setShow(false)}
        delay={props.delay}
        autohide
      >
        <Toast.Header>
          <img src="holder.js/20x20?text=%20" className="rounded mr-2" alt="" />
          <strong className="mr-auto">{props.title}</strong>
        </Toast.Header>
        <Toast.Body style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)' }}>
          {props.body}
        </Toast.Body>
      </Toast>
    </div>
  );
}

ToastNotification.defaultProps = defaultProps;
