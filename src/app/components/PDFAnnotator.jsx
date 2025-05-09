'use client';

import { useState, useRef, useEffect } from 'react';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { AnnotationOverlay } from './AnnotationOverlay';
import { AnnotationForm } from './AnnotationForm';

const pdfViewerStyles = `
  .rpv-core__page-layer {
    margin: 0px;
  }
`;

export default function PDFAnnotator({ pdfUrl, onSave }) {
    const [annotationState, setAnnotationState] = useState({
        annotations: [],
        oldZoomValue: '100%',
        currentZoomValue: '100%'
    });
    const [currentAnnotation, setCurrentAnnotation] = useState(null);
    const [description, setDescription] = useState('');
    const [isDrawing, setIsDrawing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [draggedAnnotation, setDraggedAnnotation] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [showOverlay, setShowOverlay] = useState(false);
    const [zoom, setZoom] = useState(100);
    const containerRef = useRef(null);
    const idCounterRef = useRef(0);
    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    useEffect(() => {
        const styleElement = document.createElement('style');
        styleElement.textContent = pdfViewerStyles;
        document.head.appendChild(styleElement);

        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'characterData' || mutation.type === 'childList') {
                    const zoomElement = document.querySelector('.rpv-zoom__popover-target-scale');
                    const pdfViewer = document.querySelector('.rpv-core__page-layer');
                    if (pdfViewer && containerRef.current) {
                        containerRef.current.style.width = `${pdfViewer.offsetWidth + 44 >= 338 ? pdfViewer.offsetWidth + 44 : 338}px`;
                    }

                    if (zoomElement) {
                        const zoomValue = zoomElement.textContent;
                        setZoom(parseInt(zoomValue));

                        setAnnotationState(prev => {
                            const originalZoom = parseInt(prev.currentZoomValue);
                            const currentZoom = parseInt(zoomValue);

                            const scaleX = currentZoom / originalZoom;
                            const scaleY = currentZoom / originalZoom;



                            const updatedAnnotations = prev.annotations.map((annotation) => {
                                return {
                                    ...annotation,
                                    x: (annotation.x - 44) * scaleX + 44,
                                    y: (annotation.y - 40) * scaleX + 40,
                                    width: annotation.width * scaleX,
                                    height: annotation.height * scaleY,
                                    hasBeenScaled: true,
                                    originalX: annotation.x,
                                    originalY: annotation.y,
                                    originalWidth: annotation.width,
                                    originalHeight: annotation.height,
                                    zoom: currentZoom,
                                };
                            });

                            const newState = {
                                annotations: updatedAnnotations,
                                oldZoomValue: prev.currentZoomValue,
                                currentZoomValue: zoomValue
                            };
                            console.log('==== newState: ', newState);
                            onSave(updatedAnnotations);

                            return newState;
                        });

                    }
                }
            });
        });

        const startObserving = () => {
            const zoomElement = document.querySelector('.rpv-zoom__popover-target-scale');
            if (zoomElement) {
                observer.observe(zoomElement, {
                    characterData: true,
                    childList: true,
                    subtree: true
                });
            }
        };

        setTimeout(startObserving, 1000);

        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        const checkPdfViewer = () => {
            const pdfViewer = document.querySelector('.rpv-core__page-layer');
            if (pdfViewer && containerRef.current) {
                containerRef.current.style.width = `${pdfViewer.offsetWidth + 44 >= 338 ? pdfViewer.offsetWidth + 44 : 338}px`;
                const displayBlockMediumElements = document.querySelectorAll('.rpv-core__display--block-medium');
                displayBlockMediumElements.forEach(element => {
                    element.style.display = 'none';
                });
            } else {
                setTimeout(checkPdfViewer, 100);
            }
        };

        checkPdfViewer();
    }, []);

    const handlePageChange = (e) => {
        setCurrentPage(e.currentPage);
    };

    const handleMouseDown = (e) => {
        const annotationElement = e.target.closest('[data-annotation-id]');
        if (annotationElement) {
            const annotationId = parseInt(annotationElement.dataset.annotationId);
            const annotation = annotationState.annotations.find(a => a.id === annotationId);
            if (annotation) {
                setIsDragging(true);
                setDraggedAnnotation(annotation);
                const rect = annotationElement.getBoundingClientRect();
                const offsetX = e.clientX - rect.left;
                const offsetY = e.clientY - rect.top;
                setDragOffset({ x: offsetX, y: offsetY });
                return;
            }
        }

        const pdfContainer = e.target.closest('.rpv-core__viewer');
        if (!pdfContainer) return;

        const rect = pdfContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setIsDrawing(true);
        setCurrentAnnotation({
            x,
            y,
            width: 0,
            height: 0,
            page: currentPage
        });
    };

    const handleMouseMove = (e) => {
        if (isDragging && draggedAnnotation) {
            const pdfContainer = e.target.closest('.rpv-core__viewer');
            if (!pdfContainer) return;

            const rect = pdfContainer.getBoundingClientRect();
            const x = e.clientX - rect.left - dragOffset.x;
            const y = e.clientY - rect.top - dragOffset.y;

            setAnnotationState(prev => ({
                ...prev,
                annotations: prev.annotations.map(annotation => {
                    if (annotation.id === draggedAnnotation.id) {
                        return {
                            ...annotation,
                            x,
                            y
                        };
                    }
                    return annotation;
                })
            }));
        } else if (isDrawing && currentAnnotation) {
            const pdfContainer = e.target.closest('.rpv-core__viewer');
            if (!pdfContainer) return;

            const rect = pdfContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const width = x - currentAnnotation.x;
            const height = y - currentAnnotation.y;

            setCurrentAnnotation({
                ...currentAnnotation,
                width,
                height
            });
        }
    };

    const handleMouseUp = () => {
        if (isDragging) {
            setIsDragging(false);
            setDraggedAnnotation(null);
            setDragOffset({ x: 0, y: 0 });
            onSave(annotationState.annotations);
        } else if (isDrawing && currentAnnotation) {
            if (Math.abs(currentAnnotation.width) > 10 && Math.abs(currentAnnotation.height) > 10) {
                setIsDrawing(false);
            } else {
                handleCancelAnnotation();
            }
        }
    };

    const handleSaveAnnotation = () => {
        if (currentAnnotation && description.trim()) {
            const normalizedAnnotation = {
                ...currentAnnotation,
                x: currentAnnotation.width < 0 ? currentAnnotation.x + currentAnnotation.width : currentAnnotation.x,
                y: currentAnnotation.height < 0 ? currentAnnotation.y + currentAnnotation.height : currentAnnotation.y,
                width: Math.abs(currentAnnotation.width),
                height: Math.abs(currentAnnotation.height),
                description: description.trim(),
                id: ++idCounterRef.current,
                zoom
            };

            setAnnotationState(prev => ({
                ...prev,
                annotations: [...prev.annotations, normalizedAnnotation]
            }));
            setCurrentAnnotation(null);
            setDescription('');
            onSave([...annotationState.annotations, normalizedAnnotation]);
        }
    };

    const handleCancelAnnotation = () => {
        setCurrentAnnotation(null);
        setDescription('');
        setIsDrawing(false);
    };

    const handleDeleteAnnotation = (id) => {
        setAnnotationState(prev => {
            const newAnnotations = prev.annotations.filter(a => a.id !== id);
            onSave(newAnnotations);
            return {
                ...prev,
                annotations: newAnnotations
            };
        });
    };

    return (
        <div className="p-6">
            {/* <div className="flex justify-between mb-4">
                <h2 className="text-xl font-semibold">
                    Page {currentPage}
                </h2>
                <div className="flex gap-4">
                    <button
                        className="px-4 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                        onClick={() => setShowOverlay(!showOverlay)}
                    >
                        {showOverlay ? 'Hide Position' : 'Show Position'}
                    </button>
                    <p className="text-sm text-gray-600">
                        {showOverlay && annotationState.currentZoomValue !== '100%' && (
                            `Zoom: ${annotationState.currentZoomValue}`
                        )}
                    </p>
                </div>
            </div> */}

            <div
                ref={containerRef}
                className="relative border border-gray-300 rounded"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            >
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.0.279/build/pdf.worker.min.js">
                    <Viewer
                        fileUrl={pdfUrl}
                        plugins={[defaultLayoutPluginInstance]}
                        defaultScale={1}
                        onPageChange={handlePageChange}
                    />
                </Worker>

                <AnnotationOverlay
                    showOverlay={showOverlay}
                    annotationState={annotationState}
                    currentAnnotation={currentAnnotation}
                    currentPage={currentPage}
                    isDrawing={isDrawing}
                    onDeleteAnnotation={handleDeleteAnnotation}
                />
            </div>

            {currentAnnotation && !isDrawing && (
                <AnnotationForm
                    description={description}
                    onDescriptionChange={setDescription}
                    onSave={handleSaveAnnotation}
                    onCancel={handleCancelAnnotation}
                />
            )}
        </div>
    );
}