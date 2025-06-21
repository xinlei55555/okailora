package ca.kailo.berkeley

import java.util.concurrent.ConcurrentHashMap
import org.springframework.stereotype.Component

@Component
class DeploymentRegistry {

    val deployments = ConcurrentHashMap<String, Deployment>()

}