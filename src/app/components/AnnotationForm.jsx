'use client';

export function AnnotationForm({
    description,
    onDescriptionChange,
    onSave,
    onCancel
}) {
    return (
        <div className="mt-4 p-4 border border-gray-300 rounded bg-gray-50">
            <div className="mb-4">
                <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-700">
                    Annotation Description
                </label>
                <input
                    id="description"
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    placeholder="Enter description for annotation"
                    autoFocus
                />
            </div>
            <div className="flex gap-2">
                <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:bg-blue-300"
                    onClick={onSave}
                    disabled={!description.trim()}
                >
                    Save Annotation
                </button>
                <button
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                    onClick={onCancel}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
} 