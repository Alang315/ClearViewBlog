import { useEffect, useState } from "react";

const CategoryFormModal = ({ open, onClose, onSave, category, loading }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setName(category?.name || "");
    setDescription(category?.description || "");
    setErrors({});
  }, [category, open]);

  const validate = () => {
    const nextErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Category name is required";
    }

    if (description.trim().length > 160) {
      nextErrors.description = "Description cannot exceed 160 characters";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    await onSave({
      name: name.trim(),
      description: description.trim(),
    });
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
      <div className="w-full max-w-xl max-h-[calc(100vh-4rem)] overflow-y-auto rounded-[32px] bg-white p-6 shadow-[0_20px_80px_rgba(15,45,80,0.16)]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {category ? "Edit Category" : "Create Category"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {category ? "Update the details for this category." : "Enter a name and optional description."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-100"
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-[#fbfcfe] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0b4f88] focus:ring-4 focus:ring-[#0b4f88]/10"
              placeholder="Enter category name"
              autoFocus
            />
            {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-[#fbfcfe] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0b4f88] focus:ring-4 focus:ring-[#0b4f88]/10"
              placeholder="Enter a short description for this category..."
              maxLength={160}
            />
            <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
              <p>{description.trim().length}/160</p>
              {errors.description && <p className="text-red-600">{errors.description}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-[#0b4f88] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0a3f70] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Saving..." : category ? "Save Changes" : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryFormModal;
