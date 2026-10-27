
import { useState } from "react";

const API_URL = "http://127.0.0.1:8000";

const initialForm = {
  customer_name: "",
  phone_number: "",
  email: "",
  garment_type: "kurti",
  description: "",
  measurements: {
    unit: "inches",
    bust: "",
    waist: "",
    hip: "",
    shoulder: "",
    sleeve_length: "",
    length: "",
  },
  fit_preference: "Regular fit",
  budget: "",
};

const StitchingForm = () => {
  const [form, setForm] = useState(initialForm);
  const [referenceImage, setReferenceImage] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdRequest, setCreatedRequest] = useState(null);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const updateMeasurement = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      measurements: {
        ...current.measurements,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setCreatedRequest(null);
    setSubmitting(true);

    try {
      const data = new FormData();

      data.append("customer_name", form.customer_name.trim());
      data.append("phone_number", form.phone_number.trim());
      data.append("email", form.email.trim());
      data.append("garment_type", form.garment_type);
      data.append("description", form.description.trim());
      data.append("fit_preference", form.fit_preference);
      data.append(
        "measurements",
        JSON.stringify(
          Object.fromEntries(
            Object.entries(form.measurements).filter(
              ([key, value]) => key === "unit" || value !== ""
            )
          )
        )
      );

      if (form.budget !== "") {
        data.append("budget", form.budget);
      }

      if (referenceImage) {
        data.append("reference_image", referenceImage);
      }

      const response = await fetch(`${API_URL}/api/stitching/`, {
        method: "POST",
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        const errors = Object.entries(result)
          .map(([field, value]) => {
            const detail = Array.isArray(value)
              ? value.join(", ")
              : typeof value === "string"
                ? value
                : JSON.stringify(value);

            return `${field}: ${detail}`;
          })
          .join("\n");

        throw new Error(errors || "Could not submit your request.");
      }

      setCreatedRequest(result);
      setMessage("Your stitching request has been submitted successfully!");

      setForm(initialForm);
      setReferenceImage(null);
      event.target.reset();
    } catch (error) {
      setMessage(
        `We couldn't submit your request. ${error.message}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openWhatsApp = () => {
    if (!createdRequest) return;

    const messageText = [
      "Hi OCTOBER | THRIFT AND CREATE!",
      `I submitted a custom stitching request (Request #${createdRequest.id}).`,
      `Garment: ${createdRequest.garment_type}`,
      "Please help me discuss pricing and next steps.",
    ].join("\n");

    // Replace this with your business WhatsApp number,
    // including country code, without + or spaces.
    const businessNumber = "";

    const url = businessNumber
      ? `https://wa.me/${businessNumber}?text=${encodeURIComponent(messageText)}`
      : `https://wa.me/?text=${encodeURIComponent(messageText)}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="stitching-form-section" id="stitching">
      <div className="stitching-form-heading">
        <p className="eyebrow">YOUR VISION, OUR CRAFT</p>
        <h2>Let's create something just for you.</h2>
        <p>
          Tell us about your design. We'll review your request and
          discuss pricing and details with you through WhatsApp.
        </p>
      </div>

      <form className="stitching-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Your name *
            <input
              name="customer_name"
              value={form.customer_name}
              onChange={updateField}
              required
              maxLength={150}
              autoComplete="name"
              placeholder="Enter your name"
            />
          </label>

          <label>
            WhatsApp number *
            <input
              name="phone_number"
              value={form.phone_number}
              onChange={updateField}
              required
              maxLength={20}
              type="tel"
              autoComplete="tel"
              placeholder="Your contact number"
            />
          </label>

          <label>
            Email (optional)
            <input
              name="email"
              value={form.email}
              onChange={updateField}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>

          <label>
            What would you like stitched? *
            <select
              name="garment_type"
              value={form.garment_type}
              onChange={updateField}
              required
            >
              <option value="blouse">Blouse</option>
              <option value="dress">Dress</option>
              <option value="shirt">Shirt</option>
              <option value="trousers">Trousers</option>
              <option value="skirt">Skirt</option>
              <option value="kurti">Kurti</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>

        <label>
          Describe your design *
          <textarea
            name="description"
            value={form.description}
            onChange={updateField}
            required
            rows={4}
            placeholder="Tell us about the design, fabric, colour and style..."
          />
        </label>

        <div className="measurement-heading">
          <h3>Your measurements</h3>
          <p>Fill in the measurements you know. You can discuss the rest with us.</p>
        </div>

        <label className="unit-select">
          Measurement unit
          <select
            name="unit"
            value={form.measurements.unit}
            onChange={updateMeasurement}
          >
            <option value="inches">Inches</option>
            <option value="cm">Centimetres</option>
          </select>
        </label>

        <div className="form-grid measurement-grid">
          {[
            ["bust", "Bust"],
            ["waist", "Waist"],
            ["hip", "Hip"],
            ["shoulder", "Shoulder"],
            ["sleeve_length", "Sleeve length"],
            ["length", "Garment length"],
          ].map(([name, label]) => (
            <label key={name}>
              {label} ({form.measurements.unit})
              <input
                name={name}
                type="number"
                min="0"
                max="500"
                step="0.1"
                value={form.measurements[name]}
                onChange={updateMeasurement}
                placeholder="Optional"
              />
            </label>
          ))}
        </div>

        <div className="form-grid">
          <label>
            Fit preference
            <select
              name="fit_preference"
              value={form.fit_preference}
              onChange={updateField}
            >
              <option>Regular fit</option>
              <option>Relaxed fit</option>
              <option>Fitted</option>
              <option>Oversized</option>
              <option>Not sure yet</option>
            </select>
          </label>

          <label>
            Approximate budget (₹)
            <input
              name="budget"
              type="number"
              min="0"
              max="99999999"
              step="0.01"
              value={form.budget}
              onChange={updateField}
              placeholder="Optional"
            />
          </label>
        </div>

        <label>
          Design reference image (optional)
          <input
            type="file"
            accept="image/*"
            onChange={(event) =>
              setReferenceImage(event.target.files?.[0] || null)
            }
          />
          <span className="field-hint">
            Upload an image of the design you have in mind.
          </span>
        </label>

        <button
          type="submit"
          className="button button-dark submit-button"
          disabled={submitting}
        >
          {submitting ? "SUBMITTING..." : "SUBMIT STITCHING REQUEST"}
        </button>

        {message && (
          <div
            className="form-message"
            role="status"
            aria-live="polite"
          >
            <p>{message}</p>

            {createdRequest && (
              <>
                <p>Request reference: #{createdRequest.id}</p>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={openWhatsApp}
                >
                  Continue on WhatsApp
                </button>
              </>
            )}
          </div>
        )}
      </form>
    </section>
  );
};

export default StitchingForm;
