'use client';

export function AnnotationOverlay({
    showOverlay,
    annotationState,
    currentAnnotation,
    currentPage,
    isDrawing,
    onDeleteAnnotation
}) {
    return (
        <>
            {/* Position overlay */}
            {showOverlay && (
                <div
                    className="absolute border-2 border-dashed border-blue-500 bg-blue-100 bg-opacity-20 pointer-events-none z-10"
                    style={{
                        top: annotationState.currentPdfPosition.y,
                        left: annotationState.currentPdfPosition.x,
                        width: annotationState.currentPdfPosition.width,
                        height: annotationState.currentPdfPosition.height
                    }}
                >
                    <div className="absolute -top-5 left-0 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        PDF Position: {Math.round(annotationState.currentPdfPosition.x)}, {Math.round(annotationState.currentPdfPosition.y)}
                    </div>
                </div>
            )}

            {/* Annotation Overlay */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Existing annotations */}
                {annotationState.annotations
                    .filter(a => a.page === currentPage)
                    .map(annotation => (
                        <div
                            key={annotation.id}
                            data-annotation-id={annotation.id}
                            className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-30 cursor-move pointer-events-auto hover:bg-blue-200 hover:bg-opacity-40"
                            style={{
                                left: `${annotation.x}px`,
                                top: `${annotation.y}px`,
                                width: `${annotation.width}px`,
                                height: `${annotation.height}px`,
                                opacity: `0.9`
                            }}
                            title={annotation.description}
                        >
                            <div className="absolute -top-5 left-0 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                {Math.round(annotation.x)}, {Math.round(annotation.y)} - {Math.round(annotation.width)}x{Math.round(annotation.height)}
                            </div>
                            <button
                                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700 z-10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteAnnotation(annotation.id);
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                {/* Current annotation being drawn */}
                {currentAnnotation && currentAnnotation.page === currentPage && (
                    <div
                        className="absolute border-2 border-dashed border-red-500 bg-red-100 bg-opacity-30 pointer-events-none"
                        style={{
                            left: `${currentAnnotation.width < 0 ? currentAnnotation.x + currentAnnotation.width : currentAnnotation.x}px`,
                            top: `${currentAnnotation.height < 0 ? currentAnnotation.y + currentAnnotation.height : currentAnnotation.y}px`,
                            width: `${Math.abs(currentAnnotation.width)}px`,
                            height: `${Math.abs(currentAnnotation.height)}px`,
                            opacity: `0.9`
                        }}
                    >
                        <div className="absolute -top-5 left-0 bg-transparent text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            {Math.round(currentAnnotation.width < 0 ? currentAnnotation.x + currentAnnotation.width : currentAnnotation.x)},
                            {Math.round(currentAnnotation.height < 0 ? currentAnnotation.y + currentAnnotation.height : currentAnnotation.y)} -
                            {Math.round(Math.abs(currentAnnotation.width))}x{Math.round(Math.abs(currentAnnotation.height))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
} 