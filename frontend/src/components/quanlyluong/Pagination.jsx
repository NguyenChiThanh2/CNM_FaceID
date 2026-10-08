// components/Pagination.js
import React from 'react';
import { Button, Card, Row, Col } from 'react-bootstrap';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <Card className="shadow-sm border-0 rounded-card mt-4">
      <Card.Body className="py-3">
        <Row className="justify-content-center">
          <Col xs="auto">
            <div className="d-flex align-items-center gap-3">
              <Button
                variant="outline-primary"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="hover-gradient-primary"
              >
                ← Trước
              </Button>
              <span className="fw-semibold" style={{ color: "#4a5568" }}>
                Trang {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline-primary"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => onPageChange(currentPage + 1)}
                className="hover-gradient-primary"
              >
                Sau →
              </Button>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default Pagination;