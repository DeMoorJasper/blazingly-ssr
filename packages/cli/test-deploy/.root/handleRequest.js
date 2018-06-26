/*
Global functions:
- GraphQL (Query GraphQL endpoint)
- Request (Send a simple http request)
*/

module.exports = async function handleRequest(req, session) {
  return {
    hello: 'world',
    req, // Never send unfiltered req to client
    session // Never send unfiltered or entire session to client
  };
}