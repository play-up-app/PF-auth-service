import { jest, expect, describe, it, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { accessibilityHeaders, wrapAccessibleResponse } from '../../middleware/accessibilityMiddleware.js';

describe('Accessibility Middleware', () => {
    let mockRequest;
    let mockResponse;
    let nextFunction;

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            setHeader: jest.fn(),
            locals: {}
        };
        nextFunction = jest.fn();
    });

    it('should set correct accessibility headers', () => {
        accessibilityHeaders(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Language', 'fr');
        expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
        expect(nextFunction).toHaveBeenCalled();
    });

    it('should store language in res.locals', () => {
        accessibilityHeaders(mockRequest, mockResponse, nextFunction);

        expect(mockResponse.locals.language).toBe('fr');
    });
});

describe('Accessible Response Wrapper', () => {
    it('should wrap success response correctly', () => {
        const testData = { key: 'value' };
        const wrapped = wrapAccessibleResponse(testData);

        expect(wrapped).toHaveProperty('data', testData);
        expect(wrapped.meta).toHaveProperty('language', 'fr');
        expect(wrapped.meta).toHaveProperty('status', 'success');
        expect(wrapped.meta).toHaveProperty('timestamp');
    });

    it('should wrap error response with description', () => {
        const testError = { message: 'Test error' };
        const wrapped = wrapAccessibleResponse(testError, { 
            status: 'error',
            message: 'Test error'
        });

        expect(wrapped.meta).toHaveProperty('status', 'error');
        expect(wrapped.meta).toHaveProperty('errorDescription', 'Test error');
    });
});

describe('Integration Tests - Accessibility', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(accessibilityHeaders);
        
        // Route de test
        app.get('/test', (req, res) => {
            res.json(wrapAccessibleResponse({
                message: 'Test response'
            }));
        });

        // Route d'erreur de test
        app.get('/error', (req, res) => {
            res.status(400).json(wrapAccessibleResponse(
                { message: 'Test error' },
                { status: 'error', message: 'Test error message' }
            ));
        });
    });

    it('should include accessibility headers in response', async () => {
        const response = await request(app).get('/test');
        
        expect(response.headers['content-language']).toBe('fr');
        expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should return properly formatted success response', async () => {
        const response = await request(app).get('/test');
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('meta');
        expect(response.body.meta).toHaveProperty('language', 'fr');
        expect(response.body.meta).toHaveProperty('status', 'success');
    });

    it('should return properly formatted error response', async () => {
        const response = await request(app).get('/error');
        
        expect(response.status).toBe(400);
        expect(response.body.meta).toHaveProperty('status', 'error');
        expect(response.body.meta).toHaveProperty('errorDescription', 'Test error message');
    });
});