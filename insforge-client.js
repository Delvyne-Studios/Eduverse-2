// InsForge SDK Client Configuration
import { createClient } from '@insforge/sdk';

// Create the InsForge client instance
const insforge = createClient({
  baseUrl: 'https://aw63n46k.us-west.insforge.app',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDQ3NDF9.bV1F7m9HL8EX-F7IjasCsDYB3C9iZxi6u9-fDI_Npb4'
});

export default insforge;
