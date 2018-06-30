module.exports = async function handleRequest(req) {
  return {
    hello: 'world',
    req // Never send unfiltered req to client
  };
}