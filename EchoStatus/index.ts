export async function index(context, req) {
  context.log("EchoStatus HTTP trigger");

  const status = parseInt(req.query.status) || 200;

  context.log(`Returning status with code ${status}`);

  context.done(null, {
    body: "",
    status: status
  });
}
