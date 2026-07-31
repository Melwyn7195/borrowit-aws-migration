import React, { useEffect, useState } from 'react';

const emptySchedule = {
  date: '',
  location: '',
};

const TITLES = {
  receive: {
    title: 'Set Receiving Details',
    description: 'Choose when and where you want to receive the rental items.',
    dateLabel: 'Receiving Date',
    locationLabel: 'Receiving Location',
    placeholder: 'Enter address or pick-up point',
  },
  return: {
    title: 'Set Return Details',
    description: 'Choose when and where you will return the rental items.',
    dateLabel: 'Return Date',
    locationLabel: 'Return Location',
    placeholder: 'Enter address or drop-off point',
  },
};

const OrderScheduleModal = ({ open, onClose, onSave, initialSchedule, type }) => {
  const [schedule, setSchedule] = useState(emptySchedule);

  useEffect(() => {
    if (open) {
      setSchedule({
        date: initialSchedule?.date || '',
        location: initialSchedule?.location || '',
      });
    }
  }, [open, initialSchedule]);

  if (!open || !type) {
    return null;
  }

  const copy = TITLES[type];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSchedule((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(schedule);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-100 p-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{copy.title}</h2>
            <p className="mt-1 text-sm text-gray-500">{copy.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close schedule modal"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <label className="flex flex-col text-sm font-medium text-gray-700">
            {copy.dateLabel}
            <input
              type="date"
              name="date"
              value={schedule.date}
              onChange={handleChange}
              className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              required
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-gray-700">
            {copy.locationLabel}
            <input
              type="text"
              name="location"
              value={schedule.location}
              onChange={handleChange}
              placeholder={copy.placeholder}
              className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              required
            />
          </label>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderScheduleModal;
