import { useEffect, useMemo, useState } from "react";
import { ImagePlus } from "lucide-react";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const readFileAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unable to read file"));
        return;
      }
      const base64 = result.split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });

const PublicationFormModal = ({
  open,
  onClose,
  onSave,
  publication,
  categories,
  loading,
}) => {
  const [title, setTitle] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setTitle(publication?.title || "");
    setSelectedCategoryIds(publication?.categories?.map((item) => item.id) || []);
    setExcerpt(publication?.excerpt || "");
    setContent(publication?.content || "");
    setImageFile(null);
    setPreviewUrl(publication?.featuredImageUrl || "");
    setImageError("");
    setErrors({});
  }, [publication, open]);

  const categoryOptions = useMemo(
    () => categories || [],
    [categories],
  );

  const validate = () => {
    const nextErrors = {};

    if (!title.trim()) {
      nextErrors.title = "Title is required";
    }

    if (!selectedCategoryIds.length) {
      nextErrors.categories = "Select at least one category";
    }

    if (!excerpt.trim()) {
      nextErrors.excerpt = "Excerpt is required";
    } else if (excerpt.trim().length > 160) {
      nextErrors.excerpt = "Excerpt cannot exceed 160 characters";
    }

    if (!content.trim()) {
      nextErrors.content = "Content is required";
    }

    if (!publication && !imageFile) {
      nextErrors.image = "Featured image is required";
    }

    if (imageError) {
      nextErrors.image = imageError;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setImageFile(null);
      setPreviewUrl(publication?.featuredImageUrl || "");
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Featured image must be JPG, PNG, or WebP");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Featured image must be 2 MB or smaller");
      return;
    }

    setImageError("");
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const payload = {
      title: title.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      categoryIds: selectedCategoryIds,
    };

    if (imageFile) {
      const base64Data = await readFileAsBase64(imageFile);
      payload.featuredImage = {
        fileName: imageFile.name,
        mimeType: imageFile.type,
        data: base64Data,
      };
    }

    await onSave(payload);
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
      <div className="w-full max-w-2xl max-h-[calc(100vh-4rem)] overflow-y-auto rounded-[32px] bg-white p-6 shadow-[0_20px_80px_rgba(15,45,80,0.16)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {publication ? "Edit Publication" : "Create Publication"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {publication ? "Update the publication details below." : "Add a new publication with image, categories, and excerpt."}
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-[#fbfcfe] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0b4f88] focus:ring-4 focus:ring-[#0b4f88]/10"
                  placeholder="Enter publication title"
                  autoFocus
                />
                {errors.title && <p className="mt-2 text-sm text-red-600">{errors.title}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Categories <span className="text-red-500">*</span>
                </label>
                <div className="grid max-h-72 gap-3 overflow-y-auto rounded-2xl border border-slate-200 bg-[#fbfcfe] p-4">
                  {categoryOptions.map((category) => (
                    <label
                      key={category.id}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 transition hover:border-slate-300"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.includes(category.id)}
                        onChange={() => {
                          const nextValues = selectedCategoryIds.includes(category.id)
                            ? selectedCategoryIds.filter((id) => id !== category.id)
                            : [...selectedCategoryIds, category.id];
                          setSelectedCategoryIds(nextValues);
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-[#0b4f88]"
                      />
                      <span>{category.name}</span>
                    </label>
                  ))}
                </div>
                {errors.categories && <p className="mt-2 text-sm text-red-600">{errors.categories}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Short Excerpt <span className="text-red-500">*</span></label>
                <textarea
                  value={excerpt}
                  onChange={(event) => setExcerpt(event.target.value)}
                  className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-[#fbfcfe] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0b4f88] focus:ring-4 focus:ring-[#0b4f88]/10"
                  placeholder="Write a short excerpt..."
                  maxLength={160}
                />
                <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
                  <span>{excerpt.trim().length}/160</span>
                  {errors.excerpt && <span className="text-red-600">{errors.excerpt}</span>}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  className="min-h-[200px] w-full rounded-2xl border border-slate-200 bg-[#fbfcfe] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0b4f88] focus:ring-4 focus:ring-[#0b4f88]/10"
                  placeholder="Write your content here..."
                />
                {errors.content && <p className="mt-2 text-sm text-red-600">{errors.content}</p>}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Featured Image {publication ? "(optional to replace)" : "*"}</label>
                <div className="rounded-3xl border border-slate-200 bg-[#fbfcfe] p-4">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="mx-auto mb-4 max-h-56 w-full rounded-3xl object-cover"
                    />
                  ) : (
                    <div className="flex h-56 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white text-slate-500">
                      <ImagePlus className="size-10" />
                    </div>
                  )}

                  <label className="mt-4 flex cursor-pointer items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    Click to {publication ? "change" : "upload"} image
                  </label>
                  <p className="mt-2 text-sm text-slate-500">JPG, PNG or WebP. Max 2MB.</p>
                  {(errors.image || imageError) && (
                    <p className="mt-2 text-sm text-red-600">{errors.image || imageError}</p>
                  )}
                </div>
              </div>

            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
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
              {loading ? "Saving..." : publication ? "Update Publication" : "Create Publication"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PublicationFormModal;
