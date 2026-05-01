// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — Endpoint Model
// Structured API endpoint data extracted from OpenAPI/Swagger/Postman specs.
// ══════════════════════════════════════════════════════════════

import { defineModel } from '@vurb/core';

export const EndpointModel = defineModel('Endpoint', m => {
    m.casts({
        method:      m.enum('HTTP method', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
        path:        m.string('API path (e.g., /api/v2/monitors)'),
        summary:     m.string('Short description of the endpoint'),
        tag:         m.string('API tag or group name'),
        parameters:  m.text('Parameter descriptions in compact format'),
    });
});
