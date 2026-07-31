import { FaStar } from "react-icons/fa";
import { useState, useEffect } from "react";

function StarRating({
  modeRate = true,
  displayRate = 0,
  showRatingText = false,
  value = null,
  onChange,
}) {
  const [rating, setRating] = useState(value ?? (modeRate ? null : displayRate));
  const [hover, setHover] = useState(null);

  const formatRatingText = (raw) => {
    const num = Number(raw ?? 0);
    if (!Number.isFinite(num)) return '0';
    const rounded = Math.round(num * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
  };

  useEffect(() => {
    if (modeRate) {
      if (value !== null && value !== undefined) {
        setRating(value);
      }
    } else {
      setRating(displayRate);
    }
  }, [modeRate, displayRate, value]);

  const handleSelect = (ratingValue) => {
    if (!modeRate) return;
    setRating(ratingValue);
    if (onChange) {
      onChange(ratingValue);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <label key={ratingValue} className="inline-block">
            {modeRate && (
              <input
                type="radio"
                name="rating"
                value={ratingValue}
                onClick={() => handleSelect(ratingValue)}
                className="hidden"
              />
            )}
            <FaStar
              size={20}
              color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
              onMouseEnter={modeRate ? () => setHover(ratingValue) : undefined}
              onMouseLeave={modeRate ? () => setHover(null) : undefined}
              style={{ cursor: modeRate ? "pointer" : "default" }}
            />
          </label>
        );
      })}
      {showRatingText && (
        <p className="ml-2 text-sm font-medium text-gray-700">
          {formatRatingText(rating ?? displayRate)}/5
        </p>
      )}
    </div>
  );
}

export default StarRating;