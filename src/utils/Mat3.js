/**
 * Mat3 - A 3x3 matrix utility for 2D transformations
 * Handles operations like translation, scaling, and combining transformations
 * Useful for manipulating rectangles when parent elements are resized
 */
class Mat3 {
  /**
   * Create a new 3x3 matrix
   * @param {Array<number>} values - Array of 9 values (row-major order)
   */
  constructor(values = null) {
    // Default to identity matrix if no values provided
    this.values = values || [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ];
    
    // Validate all values to ensure they are numbers
    this.values = this.values.map(val => 
      (typeof val === 'number' && !isNaN(val) && isFinite(val)) ? val : 0
    );
  }

  /**
   * Create a new identity matrix
   * @returns {Mat3} Identity matrix
   */
  static identity() {
    return new Mat3();
  }

  /**
   * Create a translation matrix
   * @param {number} x - X translation
   * @param {number} y - Y translation
   * @returns {Mat3} Translation matrix
   */
  static translation(x, y) {
    // Validate inputs
    const validX = (typeof x === 'number' && !isNaN(x) && isFinite(x)) ? x : 0;
    const validY = (typeof y === 'number' && !isNaN(y) && isFinite(y)) ? y : 0;
    
    return new Mat3([
      1, 0, validX,
      0, 1, validY,
      0, 0, 1
    ]);
  }

  /**
   * Create a scaling matrix
   * @param {number} sx - X scale factor
   * @param {number} sy - Y scale factor
   * @returns {Mat3} Scaling matrix
   */
  static scaling(sx, sy) {
    // Validate inputs and ensure non-zero values
    const validSx = (typeof sx === 'number' && !isNaN(sx) && isFinite(sx) && sx !== 0) ? sx : 1;
    const validSy = (typeof sy === 'number' && !isNaN(sy) && isFinite(sy) && sy !== 0) ? sy : 1;
    
    return new Mat3([
      validSx, 0, 0,
      0, validSy, 0,
      0, 0, 1
    ]);
  }

  /**
   * Multiply this matrix with another matrix
   * @param {Mat3} other - Matrix to multiply with
   * @returns {Mat3} Result of multiplication
   */
  multiply(other) {
    if (!other || !(other instanceof Mat3)) {
      console.error('Invalid matrix provided for multiplication');
      return this;
    }
    
    const a = this.values;
    const b = other.values;
    const result = new Array(9);

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        let sum = 0;
        for (let i = 0; i < 3; i++) {
          sum += a[row * 3 + i] * b[i * 3 + col];
        }
        result[row * 3 + col] = sum;
      }
    }

    return new Mat3(result);
  }

  /**
   * Apply this transformation to a point
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Object} Transformed point {x, y}
   */
  transformPoint(x, y) {
    // Validate inputs
    const validX = (typeof x === 'number' && !isNaN(x) && isFinite(x)) ? x : 0;
    const validY = (typeof y === 'number' && !isNaN(y) && isFinite(y)) ? y : 0;
    
    const m = this.values;
    // Apply homogeneous coordinate transformation
    const tx = m[0] * validX + m[1] * validY + m[2];
    const ty = m[3] * validX + m[4] * validY + m[5];
    const tw = m[6] * validX + m[7] * validY + m[8];
    
    // Prevent division by zero
    if (Math.abs(tw) < 1e-10) {
      return { x: tx, y: ty };
    }
    
    // Convert back from homogeneous coordinates
    return {
      x: tx / tw,
      y: ty / tw
    };
  }

  /**
   * Apply this transformation to a rectangle
   * @param {Object} rect - Rectangle {x, y, width, height}
   * @returns {Object} Transformed rectangle {x, y, width, height}
   */
  transformRect(rect) {
    if (!rect || typeof rect !== 'object') {
      console.error('Invalid rectangle provided for transformation');
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    
    // Validate rect properties
    const x = (typeof rect.x === 'number' && !isNaN(rect.x) && isFinite(rect.x)) ? rect.x : 0;
    const y = (typeof rect.y === 'number' && !isNaN(rect.y) && isFinite(rect.y)) ? rect.y : 0;
    const width = (typeof rect.width === 'number' && !isNaN(rect.width) && isFinite(rect.width)) ? rect.width : 0;
    const height = (typeof rect.height === 'number' && !isNaN(rect.height) && isFinite(rect.height)) ? rect.height : 0;
    
    // Transform each corner of the rectangle
    const topLeft = this.transformPoint(x, y);
    const topRight = this.transformPoint(x + width, y);
    const bottomLeft = this.transformPoint(x, y + height);
    const bottomRight = this.transformPoint(x + width, y + height);
    
    // Calculate the new bounds
    const minX = Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x);
    const minY = Math.min(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y);
    const maxX = Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x);
    const maxY = Math.max(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y);
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Get inverse of this matrix
   * @returns {Mat3|null} Inverse matrix or null if not invertible
   */
  inverse() {
    const m = this.values;
    
    // Calculate the determinant
    const det = 
      m[0] * (m[4] * m[8] - m[5] * m[7]) -
      m[1] * (m[3] * m[8] - m[5] * m[6]) +
      m[2] * (m[3] * m[7] - m[4] * m[6]);
    
    // Matrix is not invertible if determinant is close to zero
    if (Math.abs(det) < 1e-8) {
      console.warn('Matrix is not invertible (determinant near zero)');
      return null;
    }
    
    // Calculate adjugate and multiply by 1/determinant
    const invDet = 1 / det;
    const result = new Array(9);
    
    result[0] = (m[4] * m[8] - m[5] * m[7]) * invDet;
    result[1] = (m[2] * m[7] - m[1] * m[8]) * invDet;
    result[2] = (m[1] * m[5] - m[2] * m[4]) * invDet;
    result[3] = (m[5] * m[6] - m[3] * m[8]) * invDet;
    result[4] = (m[0] * m[8] - m[2] * m[6]) * invDet;
    result[5] = (m[2] * m[3] - m[0] * m[5]) * invDet;
    result[6] = (m[3] * m[7] - m[4] * m[6]) * invDet;
    result[7] = (m[1] * m[6] - m[0] * m[7]) * invDet;
    result[8] = (m[0] * m[4] - m[1] * m[3]) * invDet;
    
    return new Mat3(result);
  }

  /**
   * Create a transformation matrix for fitting a rectangle into a container with different dimensions
   * @param {Object} rect - Source rectangle {width, height}
   * @param {Object} container - Target container {width, height}
   * @param {boolean} maintainAspectRatio - Whether to maintain aspect ratio (default: true)
   * @param {string} alignX - Horizontal alignment: 'left', 'center', 'right' (default: 'center')
   * @param {string} alignY - Vertical alignment: 'top', 'center', 'bottom' (default: 'center')
   * @returns {Mat3} Transformation matrix
   */
  static createFitTransform(rect, container, maintainAspectRatio = true, alignX = 'center', alignY = 'center') {
    // Validate inputs
    if (!rect || !container) {
      console.error('Invalid rectangle or container for fit transform');
      return Mat3.identity();
    }
    
    // Ensure we have valid dimensions to prevent NaN
    const rectWidth = (typeof rect.width === 'number' && !isNaN(rect.width) && isFinite(rect.width) && rect.width > 0) ? 
        rect.width : 1;
    const rectHeight = (typeof rect.height === 'number' && !isNaN(rect.height) && isFinite(rect.height) && rect.height > 0) ? 
        rect.height : 1;
    const containerWidth = (typeof container.width === 'number' && !isNaN(container.width) && isFinite(container.width) && container.width > 0) ? 
        container.width : 1;
    const containerHeight = (typeof container.height === 'number' && !isNaN(container.height) && isFinite(container.height) && container.height > 0) ? 
        container.height : 1;
    
    let scaleX = containerWidth / rectWidth;
    let scaleY = containerHeight / rectHeight;
    
    // Guard against extreme values
    scaleX = (isFinite(scaleX) && !isNaN(scaleX)) ? scaleX : 1;
    scaleY = (isFinite(scaleY) && !isNaN(scaleY)) ? scaleY : 1;
    
    if (maintainAspectRatio) {
      const scale = Math.min(scaleX, scaleY);
      scaleX = scaleY = scale;
    }
    
    // Calculate translation based on alignment
    let tx = 0;
    let ty = 0;
    
    if (alignX === 'center') {
      tx = (containerWidth - rectWidth * scaleX) / 2;
    } else if (alignX === 'right') {
      tx = containerWidth - rectWidth * scaleX;
    }
    
    if (alignY === 'center') {
      ty = (containerHeight - rectHeight * scaleY) / 2;
    } else if (alignY === 'bottom') {
      ty = containerHeight - rectHeight * scaleY;
    }
    
    // Final validation of translation values
    tx = (isFinite(tx) && !isNaN(tx)) ? tx : 0;
    ty = (isFinite(ty) && !isNaN(ty)) ? ty : 0;
    
    // Create and combine the transformations
    const scale = Mat3.scaling(scaleX, scaleY);
    const translate = Mat3.translation(tx, ty);
    
    return translate.multiply(scale);
  }
}

export default Mat3;
