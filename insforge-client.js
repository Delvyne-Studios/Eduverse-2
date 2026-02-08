// InsForge Browser Client - Direct API Implementation
// Compatible with browser without bundler

const INSFORGE_CONFIG = {
  baseUrl: 'https://aw63n46k.us-west.insforge.app',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDQ3NDF9.bV1F7m9HL8EX-F7IjasCsDYB3C9iZxi6u9-fDI_Npb4'
};

// Browser-compatible InsForge client
const insforge = {
  auth: {
    async signUp({ email, password }) {
      try {
        const response = await fetch(`${INSFORGE_CONFIG.baseUrl}/auth/v1/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': INSFORGE_CONFIG.anonKey
          },
          body: JSON.stringify({ email, password }),
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          return { data: null, error: data };
        }
        
        return { data, error: null };
      } catch (error) {
        return { data: null, error: { message: error.message } };
      }
    },

    async signInWithPassword({ email, password }) {
      try {
        const response = await fetch(`${INSFORGE_CONFIG.baseUrl}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': INSFORGE_CONFIG.anonKey
          },
          body: JSON.stringify({ email, password }),
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          return { data: null, error: data };
        }
        
        return { data, error: null };
      } catch (error) {
        return { data: null, error: { message: error.message } };
      }
    },

    async signInWithOAuth({ provider, redirectTo }) {
      const url = `${INSFORGE_CONFIG.baseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectTo)}`;
      window.location.href = url;
      return { data: { url }, error: null };
    },

    async getCurrentSession() {
      try {
        const response = await fetch(`${INSFORGE_CONFIG.baseUrl}/auth/v1/user`, {
          headers: {
            'apikey': INSFORGE_CONFIG.anonKey
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          return { data: { session: null }, error: null };
        }
        
        const user = await response.json();
        return { 
          data: { 
            session: { 
              user,
              accessToken: 'stored-in-cookie'
            } 
          }, 
          error: null 
        };
      } catch (error) {
        return { data: { session: null }, error: null };
      }
    },

    async signOut() {
      try {
        await fetch(`${INSFORGE_CONFIG.baseUrl}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            'apikey': INSFORGE_CONFIG.anonKey
          },
          credentials: 'include'
        });
        return { error: null };
      } catch (error) {
        return { error: { message: error.message } };
      }
    }
  },

  db: {
    from(table) {
      return {
        select(columns = '*') {
          return {
            _table: table,
            _columns: columns,
            _filters: [],
            
            eq(column, value) {
              this._filters.push({ column, op: 'eq', value });
              return this;
            },

            async execute() {
              let url = `${INSFORGE_CONFIG.baseUrl}/rest/v1/${this._table}?select=${this._columns}`;
              
              this._filters.forEach(f => {
                url += `&${f.column}=${f.op}.${f.value}`;
              });

              try {
                const response = await fetch(url, {
                  headers: {
                    'apikey': INSFORGE_CONFIG.anonKey,
                    'Content-Type': 'application/json'
                  },
                  credentials: 'include'
                });

                const data = await response.json();
                
                if (!response.ok) {
                  return { data: null, error: data };
                }
                
                return { data, error: null };
              } catch (error) {
                return { data: null, error: { message: error.message } };
              }
            }
          };
        },

        async insert(rows) {
          try {
            const response = await fetch(`${INSFORGE_CONFIG.baseUrl}/rest/v1/${table}`, {
              method: 'POST',
              headers: {
                'apikey': INSFORGE_CONFIG.anonKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              },
              body: JSON.stringify(rows),
              credentials: 'include'
            });

            const data = await response.json();
            
            if (!response.ok) {
              return { data: null, error: data };
            }
            
            return { data, error: null };
          } catch (error) {
            return { data: null, error: { message: error.message } };
          }
        }
      };
    }
  }
};

export default insforge;
