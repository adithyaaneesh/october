
import { Check, Circle, X } from "lucide-react";
import "./OrderTimeline.css";

const ORDER_STEPS = [
  {
    status: "pending",
    label: "Order placed",
    description: "We've received your order.",
  },
  {
    status: "confirmed",
    label: "Order confirmed",
    description: "Your order has been confirmed.",
  },
  {
    status: "processing",
    label: "Preparing your order",
    description: "We're preparing your items.",
  },
  {
    status: "shipped",
    label: "Order shipped",
    description: "Your order is on its way.",
  },
  {
    status: "completed",
    label: "Order Delivered",
    description: "Your order is completed and Delivered.",
  },
];

const OrderTimeline = ({ status }) => {
  const currentStatus = status?.toLowerCase();
  const currentIndex = ORDER_STEPS.findIndex(
    (step) => step.status === currentStatus
  );

  if (currentStatus === "cancelled") {
    return (
      <section className="order-timeline order-timeline-cancelled">
        <div className="timeline-cancel-icon">
          <X size={20} />
        </div>

        <div>
          <h3>Order cancelled</h3>
          <p>This order has been cancelled.</p>
        </div>
      </section>
    );
  }

  if (currentIndex === -1) {
    return (
      <p className="timeline-unknown">
        Order status: {currentStatus || "Unavailable"}
      </p>
    );
  }

  return (
    <section className="order-timeline">
      <h3 className="timeline-heading">Order progress</h3>

      <div className="timeline-steps">
        {ORDER_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isReached = index <= currentIndex;

          return (
            <div
              className={`timeline-step ${
                isReached ? "timeline-step-reached" : ""
              } ${isCurrent ? "timeline-step-current" : ""}`}
              key={step.status}
            >
              <div className="timeline-marker-column">
                <div className="timeline-marker">
                  {isCompleted ? (
                    <Check size={15} />
                  ) : isCurrent ? (
                    <span className="timeline-current-dot" />
                  ) : (
                    <Circle size={13} />
                  )}
                </div>

                {index < ORDER_STEPS.length - 1 && (
                  <div className="timeline-connector" />
                )}
              </div>

              <div className="timeline-step-content">
                <p className="timeline-step-label">{step.label}</p>

                <p className="timeline-step-description">
                  {isCurrent
                    ? step.description
                    : isCompleted
                      ? "Completed"
                      : "Awaiting this step"}
                </p>

                {isCurrent && (
                  <span className="timeline-current-label">
                    Current status
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default OrderTimeline;
